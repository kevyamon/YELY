// src/hooks/useGeolocation.web.js
// GESTION GEOLOCALISATION WEB - API Navigateur Native
// STANDARD: Industriel / Bank Grade

import { useEffect, useState } from 'react';

const EXACT_MOCK_LOCATION = {
  latitude: 5.414702,
  longitude: -3.028109,
};

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null); 
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const reverseGeocodeWeb = async (coords) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const addr = data.address;
        
        const components = [
          addr.road || addr.pedestrian || addr.suburb,
          addr.city || addr.town || addr.village || addr.county
        ].filter(Boolean);
        
        setAddress(components.join(', ') || data.display_name);
      } else {
        setAddress("Adresse introuvable");
      }
    } catch (e) {
      console.error("Erreur Geocoding Web:", e);
      setAddress("Erreur reseau");
    }
  };

  useEffect(() => {
    const fetchRealLocation = async () => {
      // Fallback de test si la variable d'environnement l'exige
      if (process.env.EXPO_PUBLIC_USE_MOCK_LOCATION === 'true') {
        setLocation(EXACT_MOCK_LOCATION);
        await reverseGeocodeWeb(EXACT_MOCK_LOCATION);
        setIsLoading(false);
        return;
      }

      if (!navigator.geolocation) {
        setError("La geolocalisation n'est pas supportee par ce navigateur.");
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          await reverseGeocodeWeb(coords);
          setIsLoading(false);
        },
        (err) => {
          console.warn("Erreur API Geolocation:", err);
          setError("Impossible de recuperer votre position exacte.");
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    fetchRealLocation();
  }, []);

  return { location, address, error, isLoading };
};

export default useGeolocation;