// src/hooks/useGeolocation.js
// HOOK GÉOLOCALISATION - Filtre Haversine & Heartbeat (Anti-Ghosting)
// STANDARD: Industriel / Bank Grade

import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

// FILTRE MATHÉMATIQUE (Formule de Haversine)
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

  const requestPermission = useCallback(async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setError('Permission au premier plan refusée');
        setIsLoading(false);
        return false;
      }
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('[GEOLOCATION] Permission en arrière-plan refusée.');
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

      if (loc.mocked) {
        setError('Position falsifiée détectée. Veuillez désactiver votre Fake GPS.');
        setIsLoading(false);
        return null;
      }

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        heading: loc.coords.heading || 0,
        speed: loc.coords.speed || 0,
        accuracy: loc.coords.accuracy,
        timestamp: Date.now(),
      };
      
      lastValidLocationRef.current = coords;
      setLocation(coords);
      setError(null); 
      setIsLoading(false);
      return coords;
    } catch (err) {
      setError('Recherche du signal GPS...');
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

    if (watchPosition && !watchRef.current) {
      try {
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: enableHighAccuracy ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
            timeInterval,
            distanceInterval,
            showsBackgroundLocationIndicator: true, 
            deferredUpdatesDistance: distanceInterval,
            deferredUpdatesInterval: timeInterval
          },
          (loc) => {
            if (mounted) {
              if (loc.mocked) {
                setError('Position falsifiée détectée. Veuillez désactiver votre Fake GPS.');
                return;
              }

              // FILTRE ANTI-DÉRIVE : Rejet des signaux GPS de mauvaise qualité
              if (loc.coords.accuracy > 30) {
                return;
              }

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

                // FILTRE ANTI-DÉRIVE : On augmente le seuil à 15m pour le bruit statique
                if (distance < 15 && timeSinceLastUpdate < 60000) {
                  return; 
                }
              }
              
              const newCoords = {
                latitude: newLat,
                longitude: newLng,
                heading: loc.coords.heading || 0,
                speed: loc.coords.speed || 0,
                accuracy: loc.coords.accuracy,
                timestamp: now,
              };

              lastValidLocationRef.current = newCoords;
              setLocation(newCoords);
              setError(null); 
            }
          }
        );
      } catch (err) {
        console.error('[GEOLOCATION] Erreur Watcher', err);
        retryTimeoutRef.current = setTimeout(() => {
          if (mounted) initTracking();
        }, 3000);
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [initTracking]);

  const forceRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    initTracking();
  }, [initTracking]);

  return { location, error, isLoading, forceRefresh };
};

export default useGeolocation;