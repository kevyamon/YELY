// src/services/mapService.js
// SERVICE CARTO & GEOLOCALISATION
// Moteurs : Nominatim (Geocodage) + OSRM (Routage) + Haversine (Geofencing)
// CSCSM Level: Bank Grade

import * as Location from 'expo-location';
import { Platform } from 'react-native';

// 🛡️ REPARATION : On ne force le badge VIP que sur les applications Mobiles.
// Sur le Web, on laisse le navigateur utiliser ses propres règles pour ne pas déclencher l'alarme de sécurité (CORS).
const getApiHeaders = () => {
  const headers = {
    'Accept': 'application/json',
  };
  if (Platform.OS !== 'web') {
    headers['User-Agent'] = 'YelyApp/1.0 (contact@yely.ci)';
  }
  return headers;
};

const ADDRESS_CACHE_PRECISION = 4;
const ADDRESS_CACHE_MAX_SIZE = 50;
const ADDRESS_DEBOUNCE_MS = 1500;

const addressCache = new Map();

const roundCoord = (value) => Number(Number(value).toFixed(ADDRESS_CACHE_PRECISION));

const getCacheKey = (lat, lng) =>
  `${roundCoord(lat)},${roundCoord(lng)}`;

const writeAddressCache = (key, address) => {
  if (addressCache.size >= ADDRESS_CACHE_MAX_SIZE) {
    addressCache.delete(addressCache.keys().next().value);
  }
  addressCache.set(key, address);
};

let addressDebounceTimer = null;
const debouncedFetchAddress = (lat, lng, resolve, reject) => {
  clearTimeout(addressDebounceTimer);
  addressDebounceTimer = setTimeout(async () => {
    try {
      const safeLat = Number(lat);
      const safeLng = Number(lng);
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${safeLat}&lon=${safeLng}&format=json&email=contact@yely.ci`;
      
      const response = await fetch(url, { headers: getApiHeaders() });

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
        latitude: Number(location.coords.latitude),
        longitude: Number(location.coords.longitude),
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

      const response = await fetch(url, { headers: getApiHeaders() });

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
      return {
        latitude: Number(fallbackCoords.latitude),
        longitude: Number(fallbackCoords.longitude)
      };
    }
    throw new Error('Coordonnees introuvables.');
  }

  static async getAddressFromCoordinates(lat, lng) {
    const safeLat = Number(lat);
    const safeLng = Number(lng);

    if (isNaN(safeLat) || isNaN(safeLng)) return 'Adresse invalide';

    const cacheKey = getCacheKey(safeLat, safeLng);
    const cached = addressCache.get(cacheKey);
    if (cached) return cached;

    try {
      const address = await new Promise((resolve, reject) => {
        debouncedFetchAddress(safeLat, safeLng, resolve, reject);
      });
      writeAddressCache(cacheKey, address);
      return address;
    } catch (error) {
      if (error.message.includes('429')) {
        const fallback = `${safeLat.toFixed(4)}, ${safeLng.toFixed(4)}`;
        return fallback;
      }
      console.error('[MapService] Erreur getAddressFromCoordinates:', error.message);
      return 'Adresse introuvable';
    }
  }

  static async getRouteCoordinates(startCoords, endCoords) {
    const startLat = Number(startCoords?.latitude);
    const startLng = Number(startCoords?.longitude);
    const endLat = Number(endCoords?.latitude);
    const endLng = Number(endCoords?.longitude);

    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
      console.warn('[MapService] Routage annule : Coordonnees invalides.');
      return [];
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

      const response = await fetch(url, { headers: getApiHeaders() });

      if (!response.ok) {
        throw new Error(`Erreur HTTP OSRM: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          return data.routes[0].geometry.coordinates.map((coord) => ({
            latitude: Number(coord[1]),
            longitude: Number(coord[0]),
          }));
        }
      }
    } catch (error) {
      console.error('[MapService] Erreur OSRM Route:', error.message);
    }

    return [
      { latitude: startLat, longitude: startLng },
      { latitude: endLat, longitude: endLng },
    ];
  }

  static calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2 || !coord1.latitude || !coord2.latitude) return Infinity;

    const lat1 = Number(coord1.latitude) * Math.PI / 180;
    const lat2 = Number(coord2.latitude) * Math.PI / 180;
    const deltaLat = (Number(coord2.latitude) - Number(coord1.latitude)) * Math.PI / 180;
    const deltaLon = (Number(coord2.longitude) - Number(coord1.longitude)) * Math.PI / 180;

    const R = 6371e3;
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export default MapService;