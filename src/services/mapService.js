// src/services/mapService.js
// SERVICE CARTO & GÉOLOCALISATION - Niveau Industriel (Open Source)
// Moteurs : Nominatim (Recherche) + OSRM (Calcul d'itinéraire)

import * as Location from 'expo-location';

// 🛡️ SÉCURITÉ & BONNES PRATIQUES : Headers obligatoires pour Nominatim
// Évite le blocage (HTTP 403) qui retourne du HTML et fait crasher le parseur JSON
const API_HEADERS = {
  'User-Agent': 'YelyApp/1.0 (contact@yely.ci)',
  'Accept': 'application/json',
};

class MapService {
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

  static async getPlaceSuggestions(query) {
    if (!query || query.length < 3) return [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=ci&limit=5&email=contact@yely.ci`;
      
      const response = await fetch(url, { headers: API_HEADERS });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La réponse de l'API n'est pas du JSON valide.");
      }

      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
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
      console.error('[MapService] Erreur getPlaceSuggestions:', error.message);
      return [];
    }
  }

  static async getCoordinatesFromPlaceId(placeId, fallbackCoords) {
    if (fallbackCoords && fallbackCoords.latitude && fallbackCoords.longitude) {
      return fallbackCoords;
    }
    throw new Error('Coordonnées introuvables.');
  }

  static async getAddressFromCoordinates(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&email=contact@yely.ci`;
      
      const response = await fetch(url, { headers: API_HEADERS });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La réponse de l'API n'est pas du JSON valide (Probablement un blocage HTML).");
      }

      const data = await response.json();

      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        return parts.slice(0, 2).join(',').trim(); 
      }
      return "Adresse inconnue";
    } catch (error) {
      console.error('[MapService] Erreur getAddressFromCoordinates:', error.message);
      // On retourne un texte d'erreur clair plutôt que de laisser le front bloqué
      return "Adresse introuvable";
    }
  }

  /**
   * 🏗️ CALCUL D'ITINÉRAIRE (ROUTING VIA OSRM)
   * Génère le tracé exact en suivant les routes.
   */
  static async getRouteCoordinates(startCoords, endCoords) {
    try {
      // OSRM demande la longitude en premier (lon,lat)
      const url = `https://router.project-osrm.org/route/v1/driving/${startCoords.longitude},${startCoords.latitude};${endCoords.longitude},${endCoords.latitude}?overview=full&geometries=geojson`;
      
      const response = await fetch(url, { headers: API_HEADERS });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP OSRM: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        // 🚀 CORRECTION : Restauration de 'Ok' (norme OSRM, contrairement à Google Maps qui utilise 'OK')
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          // OSRM renvoie un tableau [longitude, latitude], MapView veut {latitude, longitude}
          return data.routes[0].geometry.coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
        }
      }
    } catch (error) {
      console.error('[MapService] Erreur OSRM Route:', error.message);
    }
    
    // Fallback de sécurité : Si le serveur échoue, on trace une ligne droite
    return [
      { latitude: startCoords.latitude, longitude: startCoords.longitude },
      { latitude: endCoords.latitude, longitude: endCoords.longitude }
    ];
  }
}

export default MapService;