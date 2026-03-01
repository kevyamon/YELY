// src/services/mapService.js
// SERVICE CARTO & GEOLOCALISATION
// Moteurs : Nominatim (Geocodage) + OSRM (Routage) + Haversine (Geofencing)

import * as Location from 'expo-location';

const API_HEADERS = {
  'User-Agent': 'YelyApp/1.0 (contact@yely.ci)',
  'Accept': 'application/json',
};

const ADDRESS_CACHE_PRECISION = 4;
const ADDRESS_CACHE_MAX_SIZE = 50;
const ADDRESS_DEBOUNCE_MS = 1500;
const ROUTE_FETCH_TIMEOUT_MS = 5000;

const addressCache = new Map();

const roundCoord = (value) => Number(value.toFixed(ADDRESS_CACHE_PRECISION));

const getCacheKey = (lat, lng) => `${roundCoord(lat)},${roundCoord(lng)}`;

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
      console.warn('[MapService] Erreur permission GPS:', error.message);
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
      console.warn('[MapService] Erreur getCurrentLocation:', error.message);
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
      console.warn('[MapService] Erreur getPlaceSuggestions:', error.message);
      return [];
    }
  }

  static async getCoordinatesFromPlaceId(placeId, fallbackCoords) {
    if (fallbackCoords && fallbackCoords.latitude && fallbackCoords.longitude) {
      return fallbackCoords;
    }
    throw new Error('Coordonnees introuvables.');
  }

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
      if (error.message.includes('429')) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      console.warn('[MapService] Erreur getAddressFromCoordinates:', error.message);
      return 'Adresse introuvable';
    }
  }

  static async getRouteCoordinates(startCoords, endCoords) {
    const sLat = startCoords.latitude || startCoords.lat;
    const sLng = startCoords.longitude || startCoords.lng;
    const eLat = endCoords.latitude || endCoords.lat;
    const eLng = endCoords.longitude || endCoords.lng;

    if (!sLat || !sLng || !eLat || !eLng) {
      console.warn('[MapService] Coordonnees invalides pour le routage.');
      return [];
    }

    const distance = this.calculateDistance({ latitude: sLat, longitude: sLng }, { latitude: eLat, longitude: eLng });
    if (distance < 10) {
      return [{ latitude: sLat, longitude: sLng }, { latitude: eLat, longitude: eLng }];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ROUTE_FETCH_TIMEOUT_MS);

      const url = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;

      const response = await fetch(url, { 
        headers: API_HEADERS,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
      console.warn('[MapService] Erreur OSRM Route:', error.message);
    }

    return [
      { latitude: sLat, longitude: sLng },
      { latitude: eLat, longitude: eLng },
    ];
  }

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