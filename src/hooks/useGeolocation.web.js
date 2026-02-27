// src/hooks/useGeolocation.web.js
// GESTION GÉOLOCALISATION WEB - Mocking Automatique Strict (Maféré)
// Récupère la position et traduit en adresse via API standard (Nominatim)

import { useEffect, useState } from 'react';

// Coordonnées exactes injectées pour les tests Web
const EXACT_MOCK_LOCATION = {
  latitude: 5.414702,
  longitude: -3.028109,
};

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null); 
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🚀 Bypasse le vrai navigateur et applique directement le Mock
    const applyMockLocation = async () => {
      setLocation(EXACT_MOCK_LOCATION);
      
      // On garde TA logique de traduction d'adresse pour que l'UI affiche bien "Maféré"
      await reverseGeocodeWeb(EXACT_MOCK_LOCATION);
      
      setIsLoading(false);
    };

    applyMockLocation();
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