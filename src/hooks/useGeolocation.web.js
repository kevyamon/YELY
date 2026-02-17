// src/hooks/useGeolocation.web.js
// GESTION GÉOLOCALISATION WEB
// Récupère la position et traduit en adresse via API standard (Nominatim)

import { useEffect, useState } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null); // Ajout de l'état adresse
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par ce navigateur.");
      setIsLoading(false);
      return;
    }

    const success = async (position) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      setLocation(coords);
      
      // Traduction immédiate (Reverse Geocoding)
      await reverseGeocodeWeb(coords);
      
      setIsLoading(false);
    };

    const fail = () => {
      setError("Accès position refusé sur le Web.");
      setIsLoading(false);
    };

    navigator.geolocation.getCurrentPosition(success, fail);

    // Optionnel : watchPosition pour le suivi en temps réel sur web
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
         const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
         };
         setLocation(coords);
         // On évite de spammer l'API de reverse geocoding à chaque mouvement sur le watch
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fonction de Reverse Geocoding Web (Utilise Nominatim OpenStreetMap)
  const reverseGeocodeWeb = async (coords) => {
    try {
      // Utilisation de l'API publique Nominatim (Respecte les standards Web/OpenSource du projet)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const addr = data.address;
        
        // Construction formatée similaire à la version mobile
        // Ex: "Plateau, Abidjan"
        const components = [
          addr.road || addr.pedestrian || addr.suburb, // Rue ou Quartier
          addr.city || addr.town || addr.village || addr.county // Ville ou Commune
        ].filter(Boolean);
        
        setAddress(components.join(', ') || data.display_name);
      } else {
        setAddress("Adresse introuvable");
      }
    } catch (e) {
      console.error("Erreur Geocoding Web:", e);
      setAddress("Erreur réseau");
    }
  };

  return { location, address, error, isLoading };
};

export default useGeolocation;