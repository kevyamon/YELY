// src/services/mapService.js
// SERVICE CARTOGRAPHIQUE ULTRA-OPTIMISÉ - Nominatim & OSRM (100% Gratuit)
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis)

import { MAFERE_ZONE } from '../utils/mafereZone';
import { fetchWithRetry } from '../utils/routeGeometry';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const ROUTING_SERVERS = [
  'https://router.project-osrm.org/route/v1/driving',
  'https://routing.openstreetmap.de/routed-car/route/v1/driving',
];

const ROUTE_FETCH_TIMEOUT_MS = 3500;
const MAX_LANDMARK_DISTANCE_METERS = 500;
const API_HEADERS = { 'User-Agent': 'YelyApp/1.0 (contact@yely.ci)' };

const FALLBACK_LANDMARKS = [
  { name: 'Grand terrain de Maféré', latitude: 5.4192, longitude: -3.0234 },
  { name: 'Mairie de Maféré', latitude: 5.4205, longitude: -3.0211 },
  { name: 'Hôpital Général de Maféré', latitude: 5.4218, longitude: -3.0245 },
  { name: 'Gare routière de Maféré', latitude: 5.4180, longitude: -3.0220 },
  { name: 'Marché central de Maféré', latitude: 5.4210, longitude: -3.0230 },
  { name: 'Pharmacie Principale', latitude: 5.4200, longitude: -3.0225 },
];

const addressCache = new Map();
const routeCache = new Map();
const ADDRESS_CACHE_MAX_SIZE = 500;
const ROUTE_CACHE_MAX_SIZE = 100;
const ADDRESS_CACHE_PRECISION = 4;

let lastSuccessfulAddress = null;
let lastSuccessfulCoords = null;
let globalPoisCache = null;
let lastPoisFetchTime = 0;
const POIS_CACHE_TTL_MS = 5 * 60 * 1000;

export const fetchActivePOIs = async () => {
  const now = Date.now();
  if (globalPoisCache && now - lastPoisFetchTime < POIS_CACHE_TTL_MS) {
    return globalPoisCache;
  }
  try {
    const { default: store } = await import('../store/store');
    const { poiApiSlice } = await import('../store/api/poiApiSlice');
    const result = await store.dispatch(poiApiSlice.endpoints.getAllPOIs.initiate(undefined, { forceRefetch: false }));
    if (result.data?.data && Array.isArray(result.data.data)) {
      globalPoisCache = result.data.data;
      lastPoisFetchTime = now;
      return globalPoisCache;
    }
  } catch (e) {
    console.warn('[MapService] Erreur sync POIs:', e.message);
  }
  return globalPoisCache || [];
};

const isPublicLandmark = (poi) => {
  if (!poi || poi.isActive === false || poi.type === 'SHOP' || poi.sellerId || poi.isShop === true) return false;
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

const writeRouteCache = (key, points, meta) => {
  if (routeCache.size >= ROUTE_CACHE_MAX_SIZE) routeCache.delete(routeCache.keys().next().value);
  routeCache.set(key, { points, meta });
};

const findSpatialCachedRoute = (sLat, sLng, eLat, eLng) => {
  const directKey = getRouteCacheKey(sLat, sLng, eLat, eLng);
  const directHit = routeCache.get(directKey);
  if (directHit?.points) return directHit.points;

  for (const entry of routeCache.values()) {
    if (!entry?.meta || !entry?.points || entry.points.length < 2) continue;
    const destDist = MapService.calculateDistance({ latitude: eLat, longitude: eLng }, entry.meta.end);
    if (destDist <= 25) {
      const startDist = MapService.calculateDistance({ latitude: sLat, longitude: sLng }, entry.meta.start);
      if (startDist <= 25) return entry.points;
    }
  }
  return null;
};

let debounceTimer = null;
const debouncedFetchAddress = (lat, lng, resolve, reject) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetchWithRetry(url, { headers: API_HEADERS }, 2);
      if (!response.ok) throw new Error('Échec du géocodage inverse');
      const data = await response.json();
      if (!data.address) throw new Error('Adresse introuvable');
      const road = data.address.road || data.address.pedestrian || data.address.suburb || data.address.neighbourhood || '';
      const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Maféré';
      const formatted = road ? `${road}, ${city}` : city;
      resolve(formatted);
    } catch (error) {
      reject(error);
    }
  }, 150);
};

class MapService {
  static preloadRoutingEngine() {
    fetchActivePOIs().catch(() => {});
  }

  static async searchPlaces(query, currentCoords = null) {
    if (!query || query.trim().length === 0) return [];
    try {
      const lowerQuery = query.toLowerCase().trim();
      const rawPois = await fetchActivePOIs();
      const allPois = [...(rawPois || []), ...FALLBACK_LANDMARKS];
      const localMatches = allPois
        .filter(poi => poi.name && poi.name.toLowerCase().includes(lowerQuery))
        .map(poi => ({
          placeId: `local_${poi._id || poi.name}_${poi.latitude}_${poi.longitude}`,
          description: `${poi.name}, Maféré`,
          mainText: poi.name,
          secondaryText: 'Maféré, Côte d\'Ivoire',
          latitude: parseFloat(poi.latitude),
          longitude: parseFloat(poi.longitude),
        }));

      let nominatimMatches = [];
      try {
        const viewbox = `${MAFERE_ZONE.minLongitude},${MAFERE_ZONE.maxLatitude},${MAFERE_ZONE.maxLongitude},${MAFERE_ZONE.minLatitude}`;
        const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ci&viewbox=${viewbox}&bounded=1&limit=5`;
        const response = await fetchWithRetry(url, { headers: API_HEADERS }, 2);
        if (response.ok) {
          const data = await response.json();
          nominatimMatches = data.map(item => ({
            placeId: `osm_${item.place_id}`,
            description: item.display_name,
            mainText: item.name || item.address?.road || item.display_name.split(',')[0],
            secondaryText: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          }));
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

    const cachedPoints = findSpatialCachedRoute(sLat, sLng, eLat, eLng);
    if (cachedPoints && cachedPoints.length > 2) return cachedPoints;

    const routeKey = getRouteCacheKey(sLat, sLng, eLat, eLng);
    const meta = { start: { latitude: sLat, longitude: sLng }, end: { latitude: eLat, longitude: eLng } };

    for (const baseUrl of ROUTING_SERVERS) {
      try {
        const url = `${baseUrl}/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
        const response = await fetchWithRetry(url, { headers: API_HEADERS, timeout: ROUTE_FETCH_TIMEOUT_MS }, 2);
        if (response && response.ok) {
          const data = await response.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const points = data.routes[0].geometry.coordinates.map((coord) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            writeRouteCache(routeKey, points, meta);
            return points;
          }
        }
      } catch (error) {
        console.warn(`[MapService] Échec routage (${baseUrl}):`, error.message);
      }
    }

    return null;
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