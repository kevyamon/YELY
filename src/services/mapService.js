// src/services/mapService.js
// SERVICE CARTO & GEOLOCALISATION
// Moteurs : Nominatim + OSRM (Routage Resilient) + Haversine + Reperes Locaux (POI)
// CSCSM Level: Bank Grade (Modularise < 325 lignes, Sans Emojis)

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import ENV from '../config/env';

const API_HEADERS = {
  'Accept': 'application/json',
  ...(Platform.OS !== 'web' && { 'User-Agent': 'YelyApp/1.0 (contact@yely.ci)' })
};

const ADDRESS_CACHE_PRECISION = 4;
const ADDRESS_CACHE_MAX_SIZE = 50;
const ROUTE_CACHE_MAX_SIZE = 40;
const ADDRESS_DEBOUNCE_MS = 1500;
const ROUTE_FETCH_TIMEOUT_MS = 6000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 1000;
const MAX_LANDMARK_DISTANCE_METERS = 350;

const addressCache = new Map();
const routeCache = new Map();
let lastSuccessfulAddress = null;
let lastSuccessfulCoords = null;
let globalPoisCache = null;
let globalPoisCacheTimestamp = 0;
const POI_CACHE_TTL = 3600 * 1000;

const getApiUrl = () => (ENV && ENV.API_URL) ? ENV.API_URL : (process.env.EXPO_PUBLIC_API_URL || '');

const fetchActivePOIs = async () => {
  if (globalPoisCache && Date.now() - globalPoisCacheTimestamp < POI_CACHE_TTL) return globalPoisCache;
  try {
    const res = await fetch(`${getApiUrl()}/pois`, { headers: API_HEADERS });
    if (res.ok) {
      const json = await res.json();
      globalPoisCache = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      globalPoisCacheTimestamp = Date.now();
      return globalPoisCache;
    }
  } catch (e) {
    console.warn('[MapService] Erreur sync POIs:', e.message);
  }
  return globalPoisCache || [];
};

const isPublicLandmark = (poi) => {
  if (!poi || poi.isActive === false) return false;
  if (poi.type === 'SHOP' || poi.sellerId || poi.isShop === true) return false;
  const name = String(poi.name || '').trim().toLowerCase();
  if (!name || name.length < 3) return false;
  const banned = ['démo', 'demo', 'compte', 'test', 'fake', 'admin', 'profil', 'sample', 'boutique', 'vendeur'];
  return !banned.some(kw => name.includes(kw));
};

const enrichWithPOI = async (address, lat, lng) => {
  try {
    const rawPois = await fetchActivePOIs();
    const pois = (rawPois || []).filter(isPublicLandmark);
    if (!pois || pois.length === 0) return address;

    let nearestPOI = null;
    let minDistance = Infinity;
    for (const poi of pois) {
      const d = MapService.calculateDistance({ latitude: lat, longitude: lng }, { latitude: parseFloat(poi.latitude), longitude: parseFloat(poi.longitude) });
      if (d < minDistance) {
        minDistance = d;
        nearestPOI = poi;
      }
    }

    if (nearestPOI && minDistance <= MAX_LANDMARK_DISTANCE_METERS) {
      let baseAddr = address || 'Maféré';
      baseAddr = (baseAddr.toLowerCase().includes('maféré') || baseAddr.toLowerCase().includes('aboisso')) ? 'Maféré' : baseAddr.split(',')[0].trim();
      return minDistance <= 30 ? `${baseAddr} (Près de : ${nearestPOI.name})` : `${baseAddr} (À ~${Math.round(minDistance)}m de : ${nearestPOI.name})`;
    }
  } catch(e) {
    console.warn('[MapService] Erreur enrichissement POI:', e.message);
  }
  return address;
};

const roundCoord = (v) => Number(v.toFixed(ADDRESS_CACHE_PRECISION));
const getCacheKey = (lat, lng) => `${roundCoord(lat)},${roundCoord(lng)}`;
const writeAddressCache = (key, address) => {
  if (addressCache.size >= ADDRESS_CACHE_MAX_SIZE) addressCache.delete(addressCache.keys().next().value);
  addressCache.set(key, address);
};

const getRouteCacheKey = (sLat, sLng, eLat, eLng) =>
  `${Number(sLat).toFixed(3)},${Number(sLng).toFixed(3)}->${Number(eLat).toFixed(3)},${Number(eLng).toFixed(3)}`;

const writeRouteCache = (key, points) => {
  if (routeCache.size >= ROUTE_CACHE_MAX_SIZE) routeCache.delete(routeCache.keys().next().value);
  routeCache.set(key, points);
};

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || ROUTE_FETCH_TIMEOUT_MS);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, RETRY_BACKOFF_MS * 2));
          continue;
        }
        if (response.status >= 500) throw new Error(`Erreur Serveur: ${response.status}`);
        return response;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, RETRY_BACKOFF_MS * Math.pow(2, i)));
    }
  }
};

let addressDebounceTimer = null;
let pendingGeocodeRequests = [];
const debouncedFetchAddress = (lat, lng, resolve, reject) => {
  pendingGeocodeRequests.push({ resolve, reject });
  clearTimeout(addressDebounceTimer);
  addressDebounceTimer = setTimeout(async () => {
    const current = [...pendingGeocodeRequests];
    pendingGeocodeRequests = [];
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&email=contact@yely.ci`;
      const response = await fetchWithRetry(url, { headers: API_HEADERS }, 2);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      const address = data?.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : 'Adresse inconnue';
      current.forEach(req => req.resolve(address));
    } catch (err) {
      current.forEach(req => req.reject(err));
    }
  }, ADDRESS_DEBOUNCE_MS);
};

const FALLBACK_LANDMARKS = [
  { name: 'Gare de Maféré', latitude: 5.4215, longitude: -3.0285 },
  { name: 'Marché Central', latitude: 5.4228, longitude: -3.0296 },
  { name: 'Mairie de Maféré', latitude: 5.4205, longitude: -3.0270 },
  { name: 'Commissariat de Police', latitude: 5.4190, longitude: -3.0255 },
  { name: 'Sous-Préfecture', latitude: 5.4245, longitude: -3.0310 },
  { name: 'Hôpital Général', latitude: 5.4180, longitude: -3.0240 },
  { name: 'Collège Moderne', latitude: 5.4260, longitude: -3.0330 },
  { name: 'Pharmacie Principale', latitude: 5.4220, longitude: -3.0290 },
  { name: 'Grand Carrefour', latitude: 5.4200, longitude: -3.0260 }
];

class MapService {
  static async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error("Accès localisation refusé.");
      return true;
    } catch (error) {
      console.warn('[MapService] Erreur permission GPS:', error.message);
      throw error;
    }
  }

  static async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { latitude: location.coords.latitude, longitude: location.coords.longitude };
    } catch (error) {
      console.warn('[MapService] Erreur getCurrentLocation:', error.message);
      throw new Error('Impossible de récupérer la position actuelle.');
    }
  }

  static async getPlaceSuggestions(query) {
    if (!query || query.length < 3) return [];
    try {
      let localMatches = [];
      try {
        const pois = await fetchActivePOIs();
        localMatches = pois
          .filter(p => isPublicLandmark(p) && p.name.toLowerCase().includes(query.toLowerCase()))
          .map(p => ({
            id: `poi-${p._id || p.name}`,
            description: `${p.name}, Maféré`,
            mainText: p.name,
            secondaryText: 'Repère local',
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
          }));
      } catch (_) {}

      let nominatimMatches = [];
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=ci&limit=5&email=contact@yely.ci`;
        const response = await fetchWithRetry(url, { headers: API_HEADERS }, 2);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            nominatimMatches = data.map((item) => ({
              id: item.place_id.toString(),
              description: item.display_name,
              mainText: item.name || item.address?.road || item.display_name.split(',')[0],
              secondaryText: item.display_name,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
            }));
          }
        }
      } catch (_) {}

      return [...localMatches, ...nominatimMatches];
    } catch (_) {
      return [];
    }
  }

  static getFallbackAddress(lat, lng) {
    if (!lat || !lng) return "Maféré";
    const rawPois = [...(globalPoisCache || []), ...FALLBACK_LANDMARKS];
    const pois = rawPois.filter(isPublicLandmark);
    let nearestPOI = null;
    let minDistance = Infinity;

    for (const poi of pois) {
      const d = MapService.calculateDistance({ latitude: lat, longitude: lng }, { latitude: parseFloat(poi.latitude), longitude: parseFloat(poi.longitude) });
      if (d < minDistance) {
        minDistance = d;
        nearestPOI = poi;
      }
    }

    if (nearestPOI && minDistance <= MAX_LANDMARK_DISTANCE_METERS) {
      if (minDistance <= 30) return `Maféré (Près de : ${nearestPOI.name})`;
      return `Maféré (À ~${Math.round(minDistance)}m de : ${nearestPOI.name})`;
    }
    return "Maféré";
  }

  static async getCoordinatesFromPlaceId(placeId, fallbackCoords) {
    if (fallbackCoords?.latitude && fallbackCoords?.longitude) return fallbackCoords;
    throw new Error('Coordonnées introuvables.');
  }

  static async getAddressFromCoordinates(lat, lng) {
    const cacheKey = getCacheKey(lat, lng);
    const cached = addressCache.get(cacheKey);
    if (cached) return cached;

    try {
      let address = await new Promise((resolve, reject) => debouncedFetchAddress(lat, lng, resolve, reject));
      address = await enrichWithPOI(address, lat, lng);
      writeAddressCache(cacheKey, address);
      lastSuccessfulAddress = address;
      lastSuccessfulCoords = { latitude: lat, longitude: lng };
      return address;
    } catch (error) {
      if (lastSuccessfulAddress && lastSuccessfulCoords) {
        const distance = MapService.calculateDistance({ latitude: lat, longitude: lng }, lastSuccessfulCoords);
        if (distance < 200) return lastSuccessfulAddress;
      }
      return MapService.getFallbackAddress(lat, lng);
    }
  }

  static async getRouteCoordinates(startCoords, endCoords) {
    const sLat = startCoords.latitude || startCoords.lat;
    const sLng = startCoords.longitude || startCoords.lng;
    const eLat = endCoords.latitude || endCoords.lat;
    const eLng = endCoords.longitude || endCoords.lng;
    if (!sLat || !sLng || !eLat || !eLng) return null;

    const distance = this.calculateDistance({ latitude: sLat, longitude: sLng }, { latitude: eLat, longitude: eLng });
    if (distance < 10) return [{ latitude: sLat, longitude: sLng }, { latitude: eLat, longitude: eLng }];

    const routeKey = getRouteCacheKey(sLat, sLng, eLat, eLng);
    const cachedRoute = routeCache.get(routeKey);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
      const response = await fetchWithRetry(url, { headers: API_HEADERS, timeout: ROUTE_FETCH_TIMEOUT_MS }, MAX_RETRIES);
      if (response.ok) {
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const points = data.routes[0].geometry.coordinates.map((coord) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          writeRouteCache(routeKey, points);
          return points;
        }
      }
    } catch (error) {
      console.warn('[MapService] Erreur OSRM Route:', error.message);
    }

    if (cachedRoute && cachedRoute.length > 2) return cachedRoute;
    return [{ latitude: sLat, longitude: sLng }, { latitude: eLat, longitude: eLng }];
  }

  static calculateDistance(coord1, coord2) {
    if (!coord1?.latitude || !coord2?.latitude) return Infinity;
    const R = 6371e3;
    const lat1 = coord1.latitude * Math.PI / 180;
    const lat2 = coord2.latitude * Math.PI / 180;
    const deltaLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const deltaLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export default MapService;