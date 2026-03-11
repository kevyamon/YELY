// src/hooks/useGeolocation.js
// HOOK GEOLOCALISATION - Anti-Crash, Backoff Exponentiel & Bouclier Spatial
// STANDARD: Industriel / Bank Grade

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocationTask';
import { isLocationInMafereZone, MAFERE_CENTER } from '../utils/mafereZone';

const MAX_RETRIES = 3;

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const p1 = lat1 * (Math.PI / 180);
  const p2 = lat2 * (Math.PI / 180);
  const dp = (lat2 - lat1) * (Math.PI / 180);
  const dl = (lon2 - lon1) * (Math.PI / 180);
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
    distanceInterval = 5, 
    timeInterval = 3000, 
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const watchRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const lastValidLocationRef = useRef(null);
  
  const isStartingRef = useRef(false);
  const retryCountRef = useRef(0);

  const requestPermission = useCallback(async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setError('Permission au premier plan refusee');
        setIsLoading(false);
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted' && __DEV__) {
        console.warn("Permission GPS en arriere-plan refusee.");
      }

      return true;
    } catch (err) {
      setError('Erreur lors de la demande de permission');
      setIsLoading(false);
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async () => {
    try {
      setError(null); 
      const loc = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
      });

      if (loc.mocked && !__DEV__) {
        setError('Position falsifiee detectee. Veuillez desactiver le Fake GPS.');
        setIsLoading(false);
        return 'MOCK_DETECTED';
      }

      let coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        heading: loc.coords.heading || 0,
        speed: 0, 
        accuracy: loc.coords.accuracy,
        timestamp: Date.now(),
      };
      
      if (!isLocationInMafereZone(coords)) {
        if (__DEV__) {
          console.log('[GEOFENCE] Hors zone en DEV. Teleportation a Mafere.');
          coords = { ...coords, latitude: MAFERE_CENTER.latitude, longitude: MAFERE_CENTER.longitude };
        } else {
          setError('Zone non couverte. Yely est uniquement disponible a Mafere.');
          setIsLoading(false);
          return 'OUT_OF_ZONE';
        }
      }

      lastValidLocationRef.current = coords;
      setLocation(coords);
      setIsLoading(false);
      retryCountRef.current = 0; 
      return coords;
    } catch (err) {
      setError('Recherche du signal GPS...');
      setIsLoading(false); 
      return null;
    }
  }, [enableHighAccuracy]);

  const initTracking = useCallback(async () => {
    let mounted = true;
    const granted = await requestPermission();
    
    if (!granted) return;

    const initialCoords = await getCurrentPosition();

    if (initialCoords === 'MOCK_DETECTED' || initialCoords === 'OUT_OF_ZONE') {
       return; 
    }

    if (!initialCoords) {
      if (retryCountRef.current >= MAX_RETRIES) {
        setError('Impossible d obtenir la position GPS. Verifiez vos parametres.');
        setIsLoading(false);
        return; 
      }

      const backoffTime = Math.min(3000 * Math.pow(2, retryCountRef.current), 15000);
      retryCountRef.current += 1;
      
      retryTimeoutRef.current = setTimeout(() => {
        if (mounted) initTracking();
      }, backoffTime); 
      return; 
    }

    if (watchPosition && !watchRef.current && !isStartingRef.current) {
      isStartingRef.current = true;
      try {
        const watcher = await Location.watchPositionAsync(
          {
            accuracy: enableHighAccuracy ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
            timeInterval,
            distanceInterval,
            showsBackgroundLocationIndicator: true, 
            deferredUpdatesDistance: distanceInterval,
            deferredUpdatesInterval: timeInterval
          },
          (loc) => {
            if (!mounted) return;

            if (loc.mocked && !__DEV__) {
              setError('Position falsifiee detectee.');
              if (watchRef.current) {
                watchRef.current.remove();
                watchRef.current = null;
              }
              return;
            }

            const accuracy = loc.coords.accuracy || 100;
            const maxAccuracy = __DEV__ ? 2000 : 100;
            if (accuracy > maxAccuracy) return;

            let newLat = loc.coords.latitude;
            let newLng = loc.coords.longitude;
            const now = Date.now();

            if (!isLocationInMafereZone({ latitude: newLat, longitude: newLng })) {
              if (__DEV__) {
                newLat = MAFERE_CENTER.latitude;
                newLng = MAFERE_CENTER.longitude;
              } else {
                setError('Zone non couverte. Vous etes sorti de Mafere.');
                if (watchRef.current) {
                  watchRef.current.remove();
                  watchRef.current = null;
                }
                return;
              }
            }

            if (lastValidLocationRef.current) {
              const distance = getDistanceInMeters(
                lastValidLocationRef.current.latitude,
                lastValidLocationRef.current.longitude,
                newLat,
                newLng
              );
              const timeSinceLastUpdate = now - (lastValidLocationRef.current.timestamp || 0);

              const minDistance = __DEV__ ? 15 : 10;
              if (distance < minDistance) return; 

              if (timeSinceLastUpdate > 0) {
                const calculatedSpeedKmh = (distance / (timeSinceLastUpdate / 1000)) * 3.6;
                if (calculatedSpeedKmh > 180 && !__DEV__) return;
              }
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
            setError(null); 
            retryCountRef.current = 0; 
          }
        );

        if (!mounted) {
          watcher.remove();
        } else {
          watchRef.current = watcher;
        }

        try {
          const hasBackgroundPermission = (await Location.getBackgroundPermissionsAsync()).status === 'granted';
          if (hasBackgroundPermission && !__DEV__) {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
            if (!isRegistered) {
              await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                accuracy: enableHighAccuracy ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
                timeInterval,
                distanceInterval,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                  notificationTitle: "Yely Actif",
                  notificationBody: "Suivi GPS en cours.",
                  notificationColor: "#D4AF37",
                }
              });
            }
          }
        } catch (taskError) {
          console.log('Ignored TaskManager error in dev mode.');
        }

      } catch (err) {
        if (retryCountRef.current < MAX_RETRIES) {
          const backoffTime = Math.min(3000 * Math.pow(2, retryCountRef.current), 15000);
          retryCountRef.current += 1;
          retryTimeoutRef.current = setTimeout(() => {
            if (mounted) initTracking();
          }, backoffTime);
        }
      } finally {
        isStartingRef.current = false;
      }
    }
    
    return () => { mounted = false; };
  }, [requestPermission, getCurrentPosition, watchPosition, enableHighAccuracy, timeInterval, distanceInterval]);

  useEffect(() => {
    const cleanup = initTracking();
    return () => {
      if (cleanup && typeof cleanup === 'function') cleanup();
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      
      try {
        TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK).then(isRegistered => {
          if (isRegistered) {
            Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
          }
        }).catch(() => {});
      } catch (e) {}
    };
  }, [initTracking]);

  const forceRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    retryCountRef.current = 0; 
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    initTracking();
  }, [initTracking]);

  return { location, error, isLoading, forceRefresh };
};

export default useGeolocation;