// src/hooks/useGeolocation.web.js
// GESTION GEOLOCALISATION WEB - API Navigateur Native & Intelligence Appareil
// CSCSM Level: Bank Grade

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

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
      }
    } catch (e) {
      console.warn("Erreur Geocoding Web silencieuse");
    }
  };

  const startTracking = useCallback(async () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLoading(true);

    if (process.env.EXPO_PUBLIC_USE_MOCK_LOCATION === 'true') {
      setLocation(EXACT_MOCK_LOCATION);
      await reverseGeocodeWeb(EXACT_MOCK_LOCATION);
      setIsLoading(false);
      setIsPermissionDenied(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce navigateur.");
      setIsLoading(false);
      return;
    }

    // 🧠 DÉTECTION INTELLIGENTE DU TYPE D'APPAREIL
    // Un PC n'a pas de puce GPS. Inutile de le faire ramer avec 'enableHighAccuracy'.
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setIsPermissionDenied(false);
        setError(null);
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || 0,
          speed: position.coords.speed || 0,
        };
        setLocation(coords);
        setIsLoading(false);
        if (!address) reverseGeocodeWeb(coords);
      },
      (err) => {
        setIsLoading(false);
        if (err.code === 1) {
          setIsPermissionDenied(true);
          setError("Accès au GPS refusé.");
        } else {
          console.warn("[GPS WEB] Erreur/Timeout:", err.message);
          setError("Recherche de votre position GPS...");
        }
      },
      { 
        // Sur Mobile, on exige le vrai GPS. Sur PC, on prend l'IP rapide.
        enableHighAccuracy: isMobile, 
        // Sur PC, on ne lui laisse que 5 secondes pour chercher au lieu de 15.
        timeout: isMobile ? 15000 : 5000, 
        maximumAge: 5000
      }
    );
  }, [address]);

  useEffect(() => {
    startTracking();
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startTracking]);

  return { location, address, error, isLoading, isPermissionDenied, retryGeolocation: startTracking };
};

export default useGeolocation;