// src/hooks/useGeolocation.js
// Hook pour la géolocalisation avec gestion d'erreurs

import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

const useGeolocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    watchPosition = true,
    distanceInterval = 10, // mètres
    timeInterval = 5000, // ms
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const watchRef = useRef(null);

  // Demander les permissions
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setError('Permission de localisation refusée. Yély a besoin de votre position pour fonctionner.');
        setIsLoading(false);
        return false;
      }

      // Vérifier si le GPS est activé
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        setError('Le GPS est désactivé. Veuillez l\'activer pour utiliser Yély.');
        setIsLoading(false);
        return false;
      }

      return true;
    } catch (err) {
      setError('Impossible d\'accéder à la localisation.');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Obtenir la position actuelle (une seule fois)
  const getCurrentPosition = useCallback(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy
          ? Location.Accuracy.BestForNavigation
          : Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        heading: loc.coords.heading,
        speed: loc.coords.speed,
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp,
      };

      setLocation(coords);
      setIsLoading(false);
      return coords;
    } catch (err) {
      setError('Impossible d\'obtenir votre position.');
      setIsLoading(false);
      return null;
    }
  }, [enableHighAccuracy]);

  // Surveillance continue
  const startWatching = useCallback(async () => {
    if (watchRef.current) return;

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: enableHighAccuracy
          ? Location.Accuracy.BestForNavigation
          : Location.Accuracy.Balanced,
        distanceInterval,
        timeInterval,
      },
      (loc) => {
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          heading: loc.coords.heading,
          speed: loc.coords.speed,
          accuracy: loc.coords.accuracy,
          timestamp: loc.timestamp,
        };
        setLocation(coords);
        setIsLoading(false);
      }
    );
  }, [enableHighAccuracy, distanceInterval, timeInterval]);

  const stopWatching = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }, []);

  // Initialisation
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const granted = await requestPermission();
      if (!granted || !mounted) return;

      await getCurrentPosition();

      if (watchPosition && mounted) {
        await startWatching();
      }
    };

    init();

    return () => {
      mounted = false;
      stopWatching();
    };
  }, []);

  return {
    location,
    error,
    isLoading,
    permissionStatus,
    getCurrentPosition,
    startWatching,
    stopWatching,
    requestPermission,
  };
};

export default useGeolocation;