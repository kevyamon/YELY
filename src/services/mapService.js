// src/services/mapService.js
// SERVICE CARTO & GEOLOCALISATION
// Moteurs : Nominatim (Geocodage) + OSRM (Routage) + Haversine (Geofencing)

import * as Location from 'expo-location';

const API_HEADERS = {
  'User-Agent': 'YelyApp/1.0 (contact@yely.ci)',
  'Accept': 'application/json',
};

// Precision du cache d'adresse : les coordonnees sont arrondies a ~11m
// pour que deux positions proches partagent le meme cache sans appel reseau.
const ADDRESS_CACHE_PRECISION = 4;
const ADDRESS_CACHE_MAX_SIZE = 50;
const ADDRESS_DEBOUNCE_MS = 1500;

// Cache LRU leger : evite les appels Nominatim repetitifs (protection anti-429)
const addressCache = new Map();

const roundCoord = (value) => Number(value.toFixed(ADDRESS_CACHE_PRECISION));

const getCacheKey = (lat, lng) =>
  `${roundCoord(lat)},${roundCoord(lng)}`;

const writeAddressCache = (key, address) => {
  if (addressCache.size >= ADDRESS_CACHE_MAX_SIZE) {
    // Supprime la premiere entree (la plus ancienne)
    addressCache.delete(addressCache.keys().next().value);
  }
  addressCache.set(key, address);
};

// Debounce pour les appels d'adresse inverses : les clics rapides sur +3M
// generaient un appel Nominatim par position, saturant le quota (429).
// Un seul appel reseau est envoye apres ADDRESS_DEBOUNCE_MS ms d'inactivite.
let addressDebounceTimer = null;
const debouncedFetchAddress = (lat, lng, resolve, reject) => {
  clearTimeout(addressDebounceTimer);
  addressDebounceTimer = setTimeout(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&email=contact@yely.ci`;
      const response = await fetch(url, { headers: API_HEADERS });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("La reponse de l'API n'est pas du JSON valide.");
      }

      const data = await response.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        resolve(parts.slice(0, 2).join(',').trim());
      } else {
        resolve('Adresse inconnue');
      }
    } catch (err) {
      reject(err);
    }
  }, ADDRESS_DEBOUNCE_MS);
};

class MapService {
  static async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error("L'acces a la localisation a ete refuse par l'utilisateur.");
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
      throw new Error('Impossible de recuperer la position actuelle.');
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("La reponse de l'API n'est pas du JSON valide.");
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
    throw new Error('Coordonnees introuvables.');
  }

  // Geocodage inverse avec cache LRU + debounce anti-429.
  // Si la position est deja connue (rayon ~11m), retourne instantanement.
  // Sinon, attend ADDRESS_DEBOUNCE_MS ms avant d'envoyer la requete reseau.
  static async getAddressFromCoordinates(lat, lng) {
    const cacheKey = getCacheKey(lat, lng);
    const cached = addressCache.get(cacheKey);
    if (cached) return cached;

    try {
      const address = await new Promise((resolve, reject) => {
        debouncedFetchAddress(lat, lng, resolve, reject);
      });
      writeAddressCache(cacheKey, address);
      return address;
    } catch (error) {
      // Sur 429, on retourne les coordonnees brutes sans crasher
      if (error.message.includes('429')) {
        const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        return fallback;
      }
      console.error('[MapService] Erreur getAddressFromCoordinates:', error.message);
      return 'Adresse introuvable';
    }
  }

  // Routage reel via OSRM (Open Source Routing Machine).
  // Retourne un tableau de coordonnees qui suivent les vraies routes.
  // En cas d'echec reseau, fallback sur la ligne droite A→B.
  static async getRouteCoordinates(startCoords, endCoords) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startCoords.longitude},${startCoords.latitude};${endCoords.longitude},${endCoords.latitude}?overview=full&geometries=geojson`;

      const response = await fetch(url, { headers: API_HEADERS });

      if (!response.ok) {
        throw new Error(`Erreur HTTP OSRM: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          return data.routes[0].geometry.coordinates.map((coord) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
        }
      }
    } catch (error) {
      console.error('[MapService] Erreur OSRM Route:', error.message);
    }

    // Fallback : ligne droite si OSRM est inaccessible
    return [
      { latitude: startCoords.latitude, longitude: startCoords.longitude },
      { latitude: endCoords.latitude, longitude: endCoords.longitude },
    ];
  }

  // Formule de Haversine - precision au metre
  static calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2 || !coord1.latitude || !coord2.latitude) return Infinity;

    const R = 6371e3;
    const lat1 = coord1.latitude * Math.PI / 180;
    const lat2 = coord2.latitude * Math.PI / 180;
    const deltaLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const deltaLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export default MapService;