// src/hooks/useGeolocation.js
// HOOK GÉOLOCALISATION - Pure GPS Hardware (Anti-Snapping & Haute Précision)
// CSCSM Level: Bank Grade (Strictement modulaire, Zéro watcher orphelin)

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocationTask';
import { setGpsStatus, updateCoords } from '../store/slices/locationSlice';
import { isLocationInMafereZone } from '../utils/mafereZone';

const MAX_RETRIES = 3;

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const useGeolocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    watchPosition = true,
    distanceInterval = 2,
    timeInterval = 1500,
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  const watchRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const lastValidLocationRef = useRef(null);
  const isComponentMountedRef = useRef(true);
  const isStartingRef = useRef(false);
  const retryCountRef = useRef(0);

  const requestPermission = useCallback(async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        if (isComponentMountedRef.current) {
          setError('Permission au premier plan refusée');
          setIsLoading(false);
        }
        return false;
      }
      return true;
    } catch (err) {
      if (isComponentMountedRef.current) {
        setError('Erreur lors de la demande de permission');
        setIsLoading(false);
      }
      return false;
    }
  }, []);

  const getCurrentPositionWithTimeout = async (opts) => {
    return Promise.race([
      Location.getCurrentPositionAsync(opts),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout GPS')), 4000))
    ]);
  };

  const getCurrentPosition = useCallback(async () => {
    try {
      if (isComponentMountedRef.current) setError(null);

      let loc;
      try {
        loc = await getCurrentPositionWithTimeout({
          accuracy: Location.Accuracy.High,
        });
      } catch (timeoutOrError) {
        loc = await Location.getLastKnownPositionAsync({});
        if (!loc) throw new Error('Aucune position connue');
      }

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        heading: loc.coords.heading || 0,
        speed: 0,
        accuracy: loc.coords.accuracy || 10,
        timestamp: Date.now(),
      };

      if (!isLocationInMafereZone(coords)) {
        if (isComponentMountedRef.current) setError('Vous êtes hors de la zone de couverture de Yély.');
      } else if (isComponentMountedRef.current) {
        setError(null);
      }

      if (isComponentMountedRef.current) {
        lastValidLocationRef.current = coords;
        setLocation(coords);
        dispatch(updateCoords(coords));
        setIsLoading(false);
        retryCountRef.current = 0;
      }
      return coords;
    } catch (err) {
      if (isComponentMountedRef.current) {
        setError('Recherche du signal GPS...');
        setIsLoading(false);
      }
      return null;
    }
  }, [dispatch]);

  const stopWatching = useCallback(() => {
    if (watchRef.current) {
      try {
        watchRef.current.remove();
      } catch (_) {}
      watchRef.current = null;
    }
  }, []);

  const initTracking = useCallback(async () => {
    if (!isComponentMountedRef.current) return;
    const granted = await requestPermission();
    if (!granted || !isComponentMountedRef.current) return;

    // Récupération rapide de la position récente valide
    try {
      const fastLoc = await Location.getLastKnownPositionAsync({});
      if (fastLoc?.coords && isComponentMountedRef.current && !lastValidLocationRef.current) {
        const isFresh = fastLoc.timestamp ? (Date.now() - fastLoc.timestamp < 12 * 60 * 60 * 1000) : true;
        const isAccurate = (fastLoc.coords.accuracy || 50) <= 200;

        if (isFresh && isAccurate) {
          const fastCoords = {
            latitude: fastLoc.coords.latitude,
            longitude: fastLoc.coords.longitude,
            heading: fastLoc.coords.heading || 0,
            speed: 0,
            accuracy: fastLoc.coords.accuracy || 50,
            timestamp: Date.now(),
          };
          lastValidLocationRef.current = fastCoords;
          setLocation(fastCoords);
          dispatch(updateCoords(fastCoords));
          setIsLoading(false);
        }
      }
    } catch (_) {}

    const initialCoords = await getCurrentPosition();

    if (!initialCoords && isComponentMountedRef.current) {
      if (retryCountRef.current >= MAX_RETRIES) {
        setError('Impossible d\'obtenir la position GPS. Vérifiez vos paramètres.');
        setIsLoading(false);
        return;
      }

      const backoffTime = Math.min(3000 * Math.pow(2, retryCountRef.current), 15000);
      retryCountRef.current += 1;

      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        if (isComponentMountedRef.current) initTracking();
      }, backoffTime);
      return;
    }

    if (watchPosition && !watchRef.current && !isStartingRef.current && isComponentMountedRef.current) {
      isStartingRef.current = true;
      try {
        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval,
            distanceInterval,
            showsBackgroundLocationIndicator: true
          },
          (loc) => {
            if (!isComponentMountedRef.current) return;

            const accuracy = loc.coords.accuracy || 100;
            if (accuracy > 2000) return;

            const newLat = loc.coords.latitude;
            const newLng = loc.coords.longitude;
            const now = Date.now();

            // Filtrage anti-rebond et anti-bruit pour stabiliser la carte quand l'utilisateur est immobile
            if (lastValidLocationRef.current) {
              const distanceMoved = getDistanceInMeters(
                lastValidLocationRef.current.latitude,
                lastValidLocationRef.current.longitude,
                newLat,
                newLng
              );
              // Si le déplacement est inférieur à 2.5 mètres et que la précision ne s'améliore pas, on ignore le micro-bruit
              if (distanceMoved < 2.5 && accuracy >= (lastValidLocationRef.current.accuracy || 50)) {
                return;
              }
            }

            if (!isLocationInMafereZone({ latitude: newLat, longitude: newLng })) {
              setError('Vous êtes hors de la zone de couverture.');
            } else {
              setError(null);
            }

            const newCoords = {
              latitude: newLat,
              longitude: newLng,
              heading: loc.coords.heading || 0,
              speed: loc.coords.speed || 0,
              accuracy: accuracy,
              timestamp: now,
            };

            lastValidLocationRef.current = newCoords;
            setLocation(newCoords);
            dispatch(updateCoords(newCoords));
            retryCountRef.current = 0;
          }
        );

        if (!isComponentMountedRef.current) {
          watcher.remove();
        } else {
          // On s'assure de ne jamais garder d'ancien watcher
          stopWatching();
          watchRef.current = watcher;
        }

        try {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus === 'granted' && !__DEV__) {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
            if (!isRegistered) {
              await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                accuracy: Location.Accuracy.Highest,
                timeInterval,
                distanceInterval,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                  notificationTitle: "Yély Actif",
                  notificationBody: "Suivi GPS en cours.",
                  notificationColor: "#D4AF37",
                }
              });
            }
          }
        } catch (_) {}

      } catch (err) {
        if (retryCountRef.current < MAX_RETRIES && isComponentMountedRef.current) {
          const backoffTime = Math.min(3000 * Math.pow(2, retryCountRef.current), 15000);
          retryCountRef.current += 1;
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (isComponentMountedRef.current) initTracking();
          }, backoffTime);
        }
      } finally {
        isStartingRef.current = false;
      }
    }
  }, [requestPermission, getCurrentPosition, watchPosition, timeInterval, distanceInterval, stopWatching, dispatch]);

  useEffect(() => {
    isComponentMountedRef.current = true;
    initTracking();

    return () => {
      isComponentMountedRef.current = false;
      stopWatching();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

      try {
        TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK).then((isRegistered) => {
          if (isRegistered) {
            Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
          }
        }).catch(() => {});
      } catch (_) {}
    };
  }, [initTracking, stopWatching]);

  const forceRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    retryCountRef.current = 0;
    stopWatching();
    initTracking();
  }, [initTracking, stopWatching]);

  return { location, errorMsg: error, isLoading, forceRefresh };
};

export default useGeolocation;