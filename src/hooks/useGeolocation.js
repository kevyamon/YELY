// src/hooks/useGeolocation.js

import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

const useGeolocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    watchPosition = true,
    distanceInterval = 2, 
    timeInterval = 2000, 
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const watchRef = useRef(null);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission refusee');
        setIsLoading(false);
        return false;
      }
      return true;
    } catch (err) {
      setError('Erreur permission');
      setIsLoading(false);
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        heading: loc.coords.heading || 0,
        speed: loc.coords.speed || 0,
      };
      setLocation(coords);
      setIsLoading(false);
      return coords;
    } catch (err) {
      setError('Position introuvable');
      setIsLoading(false);
      return null;
    }
  }, [enableHighAccuracy]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const granted = await requestPermission();
      if (granted && mounted) {
        await getCurrentPosition();

        if (watchPosition) {
          watchRef.current = await Location.watchPositionAsync(
            {
              accuracy: enableHighAccuracy ? Location.Accuracy.Highest : Location.Accuracy.Balanced,
              timeInterval,
              distanceInterval,
            },
            (loc) => {
              if (mounted) {
                setLocation({
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                  heading: loc.coords.heading || 0,
                  speed: loc.coords.speed || 0,
                });
              }
            }
          );
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, [watchPosition, timeInterval, distanceInterval, enableHighAccuracy, requestPermission, getCurrentPosition]);

  return { location, error, isLoading };
};

export default useGeolocation;