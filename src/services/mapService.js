// src/services/mapService.js
// SERVICE CARTO & GÉOLOCALISATION - Niveau Industriel (Open Source)
// Moteur de recherche : OpenStreetMap (Nominatim) - 100% Gratuit

import * as Location from 'expo-location';

class MapService {
  /**
   * Initialise les permissions GPS (Déjà existant)
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
        accuracy: Location.Accuracy.Balanced, // Économie de batterie
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
   * @param {string} query - Le texte tapé par l'utilisateur
   * @returns {Promise<Array>} Tableau de suggestions avec coordonnées incluses
   */
  static async getPlaceSuggestions(query) {
    if (!query || query.length < 3) return [];

    try {
      // url avec restriction sur la Côte d'Ivoire (countrycodes=ci) et limite à 5 résultats
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=ci&limit=5`;

      // 🛡️ SÉCURITÉ : Nominatim exige un User-Agent valide sous peine de bloquer l'IP
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'YelyVTCApp/1.0 (contact@yely.ci)' 
        }
      });
      
      const data = await response.json();

      if (data && data.length > 0) {
        return data.map((item) => ({
          id: item.place_id.toString(),
          description: item.display_name,
          // Extraction intelligente du nom principal pour un affichage propre
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
   * Avec OSM, les coordonnées sont déjà dans les suggestions. 
   * Cette fonction n'est plus strictement nécessaire mais conservée pour compatibilité d'interface.
   */
  static async getCoordinatesFromPlaceId(placeId, fallbackCoords) {
    // On retourne simplement les coordonnées déjà extraites lors de la recherche
    if (fallbackCoords && fallbackCoords.latitude && fallbackCoords.longitude) {
      return fallbackCoords;
    }
    throw new Error('Coordonnées introuvables.');
  }

  /**
   * GÉOCODAGE INVERSE (Coordonnées -> Adresse texte)
   * Trouve le nom de la rue à partir du GPS de l'appareil
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>} L'adresse formatée
   */
  static async getAddressFromCoordinates(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'YelyVTCApp/1.0 (contact@yely.ci)' 
        }
      });
      
      const data = await response.json();

      if (data && data.display_name) {
        // On nettoie un peu le résultat souvent très long d'OSM
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