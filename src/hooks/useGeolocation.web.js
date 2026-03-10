// src/hooks/useGeolocation.web.js
// GESTION GEOLOCALISATION WEB - Bouclier Spatial & Teleportation Dev
// CSCSM Level: Bank Grade

import { useCallback, useEffect, useRef, useState } from 'react';

// POINT ZERO DE MAFERE
const MAFERE_MOCK_LOCATION = {
  latitude: 5.414702,
  longitude: -3.028109,
  heading: 0,
  speed: 0,
  accuracy: 5
};

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
  const lastValidLocationRef = useRef(null);
  const hasFetchedAddressRef = useRef(false);

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
      console.warn("[GEOLOCATION WEB] Erreur Geocoding silencieuse");
    }
  };

  const startTracking = useCallback(async () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLoading(true);

    // LA MAGIE WEB : Si on code en local, on force la position a Mafere.
    if (__DEV__) {
      const mockWithTime = { ...MAFERE_MOCK_LOCATION, timestamp: Date.now() };
      setLocation(mockWithTime);
      lastValidLocationRef.current = mockWithTime;
      
      if (!hasFetchedAddressRef.current) {
        hasFetchedAddressRef.current = true;
        await reverseGeocodeWeb(MAFERE_MOCK_LOCATION);
      }
      
      setIsLoading(false);
      setIsPermissionDenied(false);
      return; 
    }

    // --- LE RESTE DU CODE EST POUR LA PRODUCTION (Vrai GPS) ---
    if (!navigator.geolocation) {
      setError("La geolocalisation n'est pas supportee par ce navigateur.");
      setIsLoading(false);
      return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setIsPermissionDenied(false);
        setError(null);
        
        const accuracy = position.coords.accuracy || 100;
        
        // Tolerance elargie pour le web (Les PC fixes ont une tres mauvaise precision)
        const maxAccuracy = isMobile ? 150 : 2500;

        if (accuracy > maxAccuracy) return;

        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        const now = Date.now();

        if (lastValidLocationRef.current) {
          const distance = getDistanceInMeters(
            lastValidLocationRef.current.latitude,
            lastValidLocationRef.current.longitude,
            newLat,
            newLng
          );
          const timeSinceLastUpdate = now - (lastValidLocationRef.current.timestamp || 0);

          if (distance < 12) {
            return; 
          }

          if (timeSinceLastUpdate > 0) {
            const calculatedSpeed = (distance / (timeSinceLastUpdate / 1000)) * 3.6;
            if (calculatedSpeed > 180) {
              return;
            }
          }
        }

        const coords = {
          latitude: newLat,
          longitude: newLng,
          heading: position.coords.heading || 0,
          speed: position.coords.speed || 0,
          accuracy: accuracy,
          timestamp: now
        };

        lastValidLocationRef.current = coords;
        setLocation(coords);
        setIsLoading(false);
        
        // On effectue le reverse-geocoding une seule fois pour ne pas spammer Nominatim
        if (!hasFetchedAddressRef.current) {
          hasFetchedAddressRef.current = true;
          reverseGeocodeWeb(coords);
        }
      },
      (err) => {
        setIsLoading(false);
        if (err.code === 1) {
          setIsPermissionDenied(true);
          setError("Acces au GPS refuse.");
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
  }, []); // Retrait volontaire de 'address' pour eviter la boucle de rechargement

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