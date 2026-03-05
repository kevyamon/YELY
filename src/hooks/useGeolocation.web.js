// src/hooks/useGeolocation.web.js
// GESTION GEOLOCALISATION WEB - Suivi en Temps Reel & API Navigateur
// CSCSM Level: Bank Grade

import { useEffect, useRef, useState } from 'react';

const EXACT_MOCK_LOCATION = {
  latitude: 5.414702,
  longitude: -3.028109,
  heading: 0,
  speed: 0
};

const useGeolocation = (options = {}) => {
  const { watchPosition = true } = options;

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null); 
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const watchIdRef = useRef(null);

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
    let mounted = true;

    const startTracking = async () => {
      if (process.env.EXPO_PUBLIC_USE_MOCK_LOCATION === 'true') {
        if (mounted) {
          setLocation(EXACT_MOCK_LOCATION);
          await reverseGeocodeWeb(EXACT_MOCK_LOCATION);
          setIsLoading(false);
        }
        return;
      }

      if (!navigator.geolocation) {
        if (mounted) {
          setError("La geolocalisation n'est pas supportee par ce navigateur.");
          setIsLoading(false);
        }
        return;
      }

      // Tir initial pour avoir une position tres rapide
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!mounted) return;
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0,
          };
          setLocation(coords);
          await reverseGeocodeWeb(coords);
          setIsLoading(false);
        },
        (err) => {
          if (mounted) {
            setError("Impossible de recuperer votre position initiale.");
            setIsLoading(false);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Si le mode radar est actif, on lance l'ecoute en continu
      if (watchPosition) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            if (mounted) {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                heading: position.coords.heading || 0,
                speed: position.coords.speed || 0,
              });
            }
          },
          (err) => {
            console.warn("Perte de signal GPS Web:", err);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
        );
      }
    };

    startTracking();

    return () => {
      mounted = false;
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [watchPosition]);

  return { location, address, error, isLoading };
};

export default useGeolocation;