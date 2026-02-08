// src/hooks/useGeolocation.web.js
import { useEffect, useState } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par ce navigateur.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      () => {
        setError("Accès position refusé sur le Web.");
        setIsLoading(false);
      }
    );
  }, []);

  return { location, error, isLoading };
};

export default useGeolocation;