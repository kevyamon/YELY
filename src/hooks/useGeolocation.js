// src/hooks/useGeolocation.js
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

const useGeolocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    watchPosition = true,
    distanceInterval = 10,
    timeInterval = 5000,
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const watchRef = useRef(null);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission refusée');
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
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(coords);
      setIsLoading(false);
      return coords;
    } catch (err) {
      setError('Position introuvable');
      setIsLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const granted = await requestPermission();
      if (granted && mounted) {
        await getCurrentPosition();
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  return { location, error, isLoading };
};

export default useGeolocation;