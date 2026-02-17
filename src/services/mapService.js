// src/services/mapService.js
// SERVICE CARTO & GÉOLOCALISATION - Niveau Industriel (Open Source)
// Moteur de recherche : OpenStreetMap (Nominatim) - 100% Gratuit

import * as Location from 'expo-location';

class MapService {
  /**
   * Initialise les permissions GPS
   */
  static async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error("L'accès à la localisation a été refusé par l'utilisateur.");
      }
      return true;
    } catch (error) {
      console.error('[MapService] Erreur permission GPS:', error);
      throw error;
    }
  }

  /**
   * Récupère la position actuelle de l'utilisateur
   */
  static async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, 
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('[MapService] Erreur getCurrentLocation:', error);
      throw new Error("Impossible de récupérer la position actuelle.");
    }
  }

  /**
   * 🏗️ PHASE 4 : AUTOCOMPLÉTION DES ADRESSES (OPENSTREETMAP)
   * Utilise l'API gratuite Nominatim.
   */
  static async getPlaceSuggestions(query) {
    if (!query || query.length < 3) return [];

    try {
      // CORRECTION WEB : On passe l'email dans l'URL (paramètre &email=) 
      // au lieu de le mettre dans le header 'User-Agent' pour éviter le blocage CORS du navigateur.
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=ci&limit=5&email=contact@yely.ci`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && data.length > 0) {
        return data.map((item) => ({
          id: item.place_id.toString(),
          description: item.display_name,
          mainText: item.name || item.address?.road || item.display_name.split(',')[0],
          secondaryText: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
      }
      
      return [];
    } catch (error) {
      console.error('[MapService] Erreur getPlaceSuggestions:', error);
      return [];
    }
  }

  /**
   * 🏗️ PHASE 4 : GEOCODING
   */
  static async getCoordinatesFromPlaceId(placeId, fallbackCoords) {
    if (fallbackCoords && fallbackCoords.latitude && fallbackCoords.longitude) {
      return fallbackCoords;
    }
    throw new Error('Coordonnées introuvables.');
  }

  /**
   * GÉOCODAGE INVERSE (Coordonnées -> Adresse texte)
   */
  static async getAddressFromCoordinates(lat, lng) {
    try {
      // CORRECTION WEB : Passage de l'email dans l'URL
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&email=contact@yely.ci`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        return parts.slice(0, 2).join(',').trim(); 
      }
      return "Adresse inconnue";
    } catch (error) {
      console.error('[MapService] Erreur getAddressFromCoordinates:', error);
      return "Recherche de l'adresse...";
    }
  }
}

export default MapService;