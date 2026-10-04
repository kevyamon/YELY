// src/services/mapService.js
// SERVICE CARTOGRAPHIQUE - Dual-Phase GPS & OSRM Résilient (100% Gratuit)
// CSCSM Level: Bank Grade (Strictement modulaire < 270 lignes, Sans Emojis)

import { isLocationInMafereZone, MAFERE_ZONE } from '../utils/mafereZone';
import { fetchWithRetry } from '../utils/routeGeometry';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const ROUTING_SERVERS = [
  'https://router.project-osrm.org/route/v1/driving',
  'https://routing.openstreetmap.de/routed-car/route/v1/driving',
];

const ROUTE_FETCH_TIMEOUT_MS = 5000;
const MAX_LANDMARK_DISTANCE_METERS = 500;
const API_HEADERS = { 'User-Agent': 'YelyApp/1.0 (contact@yely.ci)' };

const FALLBACK_LANDMARKS = [
  { name: 'Grand terrain de Maféré', latitude: 5.42132, longitude: -3.03378 },
  { name: 'Mairie de Maféré', latitude: 5.40611, longitude: -3.03740 },
  { name: 'Hôpital Général de Maféré', latitude: 5.41387, longitude: -3.03267 },
  { name: 'Gare routière de Maféré', latitude: 5.41496, longitude: -3.02818 },
  { name: 'Marché Central', latitude: 5.41589, longitude: -3.02878 },
  { name: 'Pharmacie Aka Ebah', latitude: 5.41293, longitude: -3.03249 },
  { name: 'Pharmacie Ste Hélène', latitude: 5.41718, longitude: -3.02811 },
  { name: 'Sous-Préfecture de Maféré', latitude: 5.41174, longitude: -3.02977 },
  { name: 'Commissariat de police de Maféré', latitude: 5.41149, longitude: -3.03044 },
];

const addressCache = new Map();
const routeCache = new Map();
let globalPoisCache = null;
let lastPoisFetchTime = 0;
const POIS_CACHE_TTL_MS = 5 * 60 * 1000;

export const fetchActivePOIs = async () => {
  const now = Date.now();
  if (globalPoisCache && now - lastPoisFetchTime < POIS_CACHE_TTL_MS) return globalPoisCache;
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

const enrichWithPOI = async (baseAddr, lat, lng) => {
  try {
    const rawPois = await fetchActivePOIs();
    const pois = [...(rawPois || []), ...FALLBACK_LANDMARKS].filter(isPublicLandmark);
    if (!pois.length) return baseAddr;

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
      const cleanBase = (baseAddr.toLowerCase().includes('maféré') || baseAddr.toLowerCase().includes('aboisso')) ? 'Maféré' : baseAddr.split(',')[0].trim();
      return minDistance <= 30 ? `${cleanBase} (près de ${nearestPOI.name})` : `${cleanBase} (à ~${Math.round(minDistance)}m de ${nearestPOI.name})`;
    }
  } catch (_) {}
  return baseAddr;
};

const getCacheKey = (lat, lng) => `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
const getRouteCacheKey = (sLat, sLng, eLat, eLng) =>
  `${Number(sLat).toFixed(4)},${Number(sLng).toFixed(4)}->${Number(eLat).toFixed(4)},${Number(eLng).toFixed(4)}`;

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
      resolve(road ? `${road}, ${city}` : city);
    } catch (error) {
      reject(error);
    }
  }, 150);
};

class MapService {
  static preloadRoutingEngine() {
    fetchActivePOIs().catch(() => {});
  }

  static getFastBaseAddress(lat, lng) {
    if (!lat || !lng) return "Maféré";
    const cacheKey = getCacheKey(lat, lng);
    if (addressCache.has(cacheKey)) return addressCache.get(cacheKey).split('(')[0].trim();
    if (isLocationInMafereZone({ latitude: lat, longitude: lng })) return "Maféré";
    return "Position GPS";
  }

  static async searchPlaces(query) {
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

  static async getAddressFromCoordinates(lat, lng) {
    const cacheKey = getCacheKey(lat, lng);
    const cached = addressCache.get(cacheKey);
    if (cached) return cached;

    try {
      let baseAddress = await new Promise((res, rej) => debouncedFetchAddress(lat, lng, res, rej));
      const enriched = await enrichWithPOI(baseAddress, lat, lng);
      addressCache.set(cacheKey, enriched);
      return enriched;
    } catch (_) {
      const fallback = MapService.getFastBaseAddress(lat, lng);
      const enriched = await enrichWithPOI(fallback, lat, lng);
      addressCache.set(cacheKey, enriched);
      return enriched;
    }
  }

  static async getRouteCoordinates(startCoords, endCoords) {
    const sLat = Number(startCoords?.latitude ?? startCoords?.lat);
    const sLng = Number(startCoords?.longitude ?? startCoords?.lng);
    const eLat = Number(endCoords?.latitude ?? endCoords?.lat);
    const eLng = Number(endCoords?.longitude ?? endCoords?.lng);
    if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) return null;

    const distance = this.calculateDistance({ latitude: sLat, longitude: sLng }, { latitude: eLat, longitude: eLng });
    if (distance < 10) return [{ latitude: sLat, longitude: sLng }, { latitude: eLat, longitude: eLng }];

    const routeKey = getRouteCacheKey(sLat, sLng, eLat, eLng);
    if (routeCache.has(routeKey)) return routeCache.get(routeKey);

    for (const baseUrl of ROUTING_SERVERS) {
      try {
        const url = `${baseUrl}/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson&radiuses=1000;1000&continue_straight=default`;
        const response = await fetchWithRetry(url, { headers: API_HEADERS, timeout: ROUTE_FETCH_TIMEOUT_MS }, 2, 200);
        if (response && response.ok) {
          const data = await response.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const rawCoords = data.routes[0].geometry?.coordinates;
            if (Array.isArray(rawCoords) && rawCoords.length >= 2) {
              const points = rawCoords.map((coord) => ({
                latitude: coord[1],
                longitude: coord[0],
              }));
              routeCache.set(routeKey, points);
              return points;
            }
          }
        }
      } catch (_) {}
    }

    // Fallback de secours si serveurs OSRM indisponibles
    const fallbackPoints = [];
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      fallbackPoints.push({
        latitude: sLat + (eLat - sLat) * (i / steps),
        longitude: sLng + (eLng - sLng) * (i / steps),
      });
    }
    return fallbackPoints;
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