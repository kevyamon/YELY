// src/hooks/useGeolocation.web.js
// GESTION GEOLOCALISATION WEB - API Navigateur Native & Fallback Intelligent
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
      }
    } catch (e) {
      console.warn("Erreur Geocoding Web silencieuse");
    }
  };

  useEffect(() => {
    let mounted = true;

    const startTracking = async () => {
      // 1. MOCK PROTEGE : S'active UNIQUEMENT si la variable est strictement 'true'
      if (process.env.EXPO_PUBLIC_USE_MOCK_LOCATION === 'true') {
        console.warn('[GPS WEB] Mode MOCK activé via variable d\'environnement.');
        if (mounted) {
          setLocation(EXACT_MOCK_LOCATION);
          await reverseGeocodeWeb(EXACT_MOCK_LOCATION);
          setIsLoading(false);
        }
        return;
      }

      if (!navigator.geolocation) {
        if (mounted) {
          setError("La géolocalisation n'est pas supportée par ce navigateur.");
          setIsLoading(false);
        }
        return;
      }

      const updatePosition = (position) => {
        if (!mounted) return;
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || 0,
          speed: position.coords.speed || 0,
        };
        setLocation(coords);
        setIsLoading(false);
      };

      // 2. FALLBACK INTELLIGENT : On lance directement le "watchPosition". 
      // Sur le web, c'est plus stable que "getCurrentPosition" qui timeout souvent si la haute précision n'est pas dispo tout de suite.
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          updatePosition(position);
          // On ne fait le reverse geocoding qu'une fois au début pour ne pas saturer l'API gratuite OSM
          if (!address && mounted) reverseGeocodeWeb(position.coords);
        },
        (err) => {
          console.warn("[GPS WEB] Erreur/Timeout:", err.message);
          // Si timeout, l'appareil galère. On le laisse réessayer en tâche de fond.
          if (mounted && !location) {
             setError("Recherche de votre position GPS...");
          }
        },
        { 
          enableHighAccuracy: true, // On demande le maximum
          timeout: 15000,           // Laisse 15 secondes pour trouver
          maximumAge: 5000          // Accepte une position datant de 5 secondes max
        }
      );
    };

    startTracking();

    return () => {
      mounted = false;
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { location, address, error, isLoading };
};

export default useGeolocation;