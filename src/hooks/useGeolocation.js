// src/hooks/useGeolocation.js
// HOOK GEOLOCALISATION - Pure GPS Hardware (Anti-Snapping & Haute Precision)
// CSCSM Level: Bank Grade

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocationTask';
import { isLocationInMafereZone } from '../utils/mafereZone';

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
    distanceInterval = 2, // Reduit pour plus de fluidite
    timeInterval = 2000, // Intervalle strict 
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
      return true;
    } catch (err) {
      setError('Erreur lors de la demande de permission');
      setIsLoading(false);
      return false;
    }
  }, []);

  const getCurrentPositionWithTimeout = async (options) => {
    return Promise.race([
      Location.getCurrentPositionAsync(options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout GPS')), 10000))
    ]);
  };

  const getCurrentPosition = useCallback(async () => {
    try {
      setError(null); 
      
      let loc;
      try {
        loc = await getCurrentPositionWithTimeout({
          accuracy: Location.Accuracy.BestForNavigation,
        });
      } catch (timeoutOrError) {
        loc = await Location.getLastKnownPositionAsync({});
        if (!loc) throw new Error('Aucune position connue');
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
        setError('Vous etes hors de la zone de couverture de Yely.');
      } else {
        setError(null);
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
  }, []);

  const initTracking = useCallback(async () => {
    let mounted = true;
    const granted = await requestPermission();
    
    if (!granted) return;

    const initialCoords = await getCurrentPosition();

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
            // CORRECTION SENIOR : Utilisation de BestForNavigation et retrait des deferredUpdates
            // pour forcer le hardware GPS et stopper l'effet "snapping" vers les antennes relais.
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval,
            distanceInterval,
            showsBackgroundLocationIndicator: true
          },
          (loc) => {
            if (!mounted) return;

            const accuracy = loc.coords.accuracy || 100;
            if (accuracy > 2000) return; 

            let newLat = loc.coords.latitude;
            let newLng = loc.coords.longitude;
            const now = Date.now();

            if (!isLocationInMafereZone({ latitude: newLat, longitude: newLng })) {
              setError('Vous etes hors de la zone de couverture.');
            } else {
              setError(null);
            }

            if (lastValidLocationRef.current) {
              const distance = getDistanceInMeters(
                lastValidLocationRef.current.latitude,
                lastValidLocationRef.current.longitude,
                newLat,
                newLng
              );
              
              const minDistance = 2; // Distance hyper sensible pour fluidite max
              if (distance < minDistance) return; 
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
            retryCountRef.current = 0; 
          }
        );

        if (!mounted) {
          watcher.remove();
        } else {
          watchRef.current = watcher;
        }

        try {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus === 'granted' && !__DEV__) {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
            if (!isRegistered) {
              await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                accuracy: Location.Accuracy.BestForNavigation,
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
  }, [requestPermission, getCurrentPosition, watchPosition, timeInterval, distanceInterval]);

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