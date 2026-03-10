// src/hooks/useGeolocation.js
// HOOK GEOLOCALISATION - Anti-Zombie Watchers & Bouclier Spatial (Foreground + Background)
// STANDARD: Industriel / Bank Grade

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocationTask';

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

  const requestPermission = useCallback(async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setError('Permission au premier plan refusee');
        setIsLoading(false);
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        if (__DEV__) console.warn("Permission GPS en arriere-plan refusee. Le suivi s'arretera si l'app est reduite.");
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
        setError('Position falsifiee detectee.');
        setIsLoading(false);
        return null;
      }

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        heading: loc.coords.heading || 0,
        speed: 0, 
        accuracy: loc.coords.accuracy,
        timestamp: Date.now(),
      };
      
      lastValidLocationRef.current = coords;
      setLocation(coords);
      setIsLoading(false);
      return coords;
    } catch (err) {
      setError('Recherche du signal GPS...');
      setIsLoading(false); // CORRECTION : On libere l'interface meme en cas d'echec
      return null;
    }
  }, [enableHighAccuracy]);

  const initTracking = useCallback(async () => {
    let mounted = true;
    const granted = await requestPermission();
    
    if (!granted) return;

    const initialCoords = await getCurrentPosition();

    if (!initialCoords) {
      retryTimeoutRef.current = setTimeout(() => {
        if (mounted) initTracking();
      }, 3000); 
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
              return;
            }

            const accuracy = loc.coords.accuracy || 100;
            if (accuracy > 50) return;

            const newLat = loc.coords.latitude;
            const newLng = loc.coords.longitude;
            const now = Date.now();

            if (lastValidLocationRef.current) {
              const distance = getDistanceInMeters(
                lastValidLocationRef.current.latitude,
                lastValidLocationRef.current.longitude,
                newLat,
                newLng
              );
              const timeSinceLastUpdate = now - (lastValidLocationRef.current.timestamp || 0);

              if (distance < 5) {
                return; 
              }

              if (timeSinceLastUpdate > 0) {
                const calculatedSpeedKmh = (distance / (timeSinceLastUpdate / 1000)) * 3.6;
                if (calculatedSpeedKmh > 180 && !__DEV__) {
                  return;
                }
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
          }
        );

        if (!mounted) {
          watcher.remove();
        } else {
          watchRef.current = watcher;
        }

        const hasBackgroundPermission = (await Location.getBackgroundPermissionsAsync()).status === 'granted';
        if (hasBackgroundPermission) {
          const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
          if (!isRegistered) {
            await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
              accuracy: enableHighAccuracy ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
              timeInterval,
              distanceInterval,
              showsBackgroundLocationIndicator: true,
              foregroundService: {
                notificationTitle: "Yely Actif",
                notificationBody: "Suivi GPS en cours pour la course.",
                notificationColor: "#D4AF37",
              }
            });
          }
        }

      } catch (err) {
        retryTimeoutRef.current = setTimeout(() => {
          if (mounted) initTracking();
        }, 3000);
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
      
      TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK).then(isRegistered => {
        if (isRegistered) {
          Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
        }
      });
    };
  }, [initTracking]);

  const forceRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK).then(isRegistered => {
      if (isRegistered) {
        Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
      }
    });
    initTracking();
  }, [initTracking]);

  return { location, error, isLoading, forceRefresh };
};

export default useGeolocation;