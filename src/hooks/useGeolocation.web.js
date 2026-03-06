// src/hooks/useGeolocation.web.js
// GESTION GEOLOCALISATION WEB - API Navigateur, Filtre Haversine & Heartbeat
// CSCSM Level: Bank Grade

import { useCallback, useEffect, useRef, useState } from 'react';

const EXACT_MOCK_LOCATION = {
  latitude: 5.414702,
  longitude: -3.028109,
  heading: 0,
  speed: 0
};

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
  const { watchPosition = true } = options;

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null); 
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const watchIdRef = useRef(null);
  // 🛡️ BOUCLIER ANTI-DANSE ET HEARTBEAT
  const lastValidLocationRef = useRef(null);

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
      const mockWithTime = { ...EXACT_MOCK_LOCATION, timestamp: Date.now() };
      setLocation(mockWithTime);
      lastValidLocationRef.current = mockWithTime;
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

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setIsPermissionDenied(false);
        setError(null);
        
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        const now = Date.now();

        // 🛡️ L'INTERCEPTEUR : Filtre spatial + Heartbeat temporel pour le Web
        if (lastValidLocationRef.current) {
          const distance = getDistanceInMeters(
            lastValidLocationRef.current.latitude,
            lastValidLocationRef.current.longitude,
            newLat,
            newLng
          );
          const timeSinceLastUpdate = now - (lastValidLocationRef.current.timestamp || 0);

          if (distance < 10 && timeSinceLastUpdate < 60000) {
            return; // Bloque la danse de la carte
          }
        }

        const coords = {
          latitude: newLat,
          longitude: newLng,
          heading: position.coords.heading || 0,
          speed: position.coords.speed || 0,
          timestamp: now
        };

        lastValidLocationRef.current = coords;
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
          setError("Recherche de votre position GPS...");
        }
      },
      { 
        enableHighAccuracy: isMobile, 
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