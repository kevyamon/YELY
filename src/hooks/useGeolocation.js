// src/hooks/useGeolocation.js
// HOOK GEOLOCALISATION - Anti-Crash, Résilient aux Fake GPS & Sans Forçage Spatial
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
        setError('Permission au premier plan refusée');
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
          accuracy: enableHighAccuracy ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
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
      
      // LOGIQUE METIER CORRIGEE : On ne bloque plus si Fake GPS ou Hors Zone.
      // On se contente d'informer, mais on met TOUJOURS à jour la position réelle.
      if (!isLocationInMafereZone(coords)) {
        setError('Vous êtes hors de la zone de couverture de Yély.');
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
  }, [enableHighAccuracy]);

  const initTracking = useCallback(async () => {
    let mounted = true;
    const granted = await requestPermission();
    
    if (!granted) return;

    const initialCoords = await getCurrentPosition();

    if (!initialCoords) {
      if (retryCountRef.current >= MAX_RETRIES) {
        setError('Impossible d obtenir la position GPS. Vérifiez vos paramètres.');
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

            // Retrait de la restriction d'accuracy trop stricte
            const accuracy = loc.coords.accuracy || 100;
            if (accuracy > 2000) return; // Tolérance très large pour accepter tous les signaux

            let newLat = loc.coords.latitude;
            let newLng = loc.coords.longitude;
            const now = Date.now();

            if (!isLocationInMafereZone({ latitude: newLat, longitude: newLng })) {
              setError('Vous êtes hors de la zone de couverture.');
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
              
              // On réduit la distance minimale pour plus de fluidité
              // Et on SUPPRIME le calcul de vitesse qui bloquait les téléportations Fake GPS
              const minDistance = 5; 
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