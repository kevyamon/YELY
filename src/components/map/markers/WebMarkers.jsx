// src/components/map/markers/WebMarkers.jsx
// COMPOSANTS VISUELS & CADRAGE CARTE WEB - Support Multi-Boutiques / Immeubles
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis, 100% Gratuit)

import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import { useMap } from 'react-leaflet';
import THEME from '../../../theme/theme';
import { MAFERE_CENTER } from '../../../utils/mafereZone';
import UniversalIcon from '../../ui/UniversalIcon';

const SVG_PIN = `<svg viewBox="0 0 24 24" fill="#D4AF37" width="20" height="20"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
const SVG_USER = `<svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
const SVG_FLAG = `<svg viewBox="0 0 24 24" fill="#E74C3C" width="26" height="26"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>`;
const SVG_CAR = `<svg viewBox="0 0 24 24" fill="#D4AF37" width="22" height="22"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;

const dynamicIconCache = new Map();
const poiIconCache = new Map();

export const resolvePoiCollisions = (pois, zoom) => {
  if (!pois || pois.length === 0) return [];
  
  let threshold = 0.0004;
  if (zoom >= 18) threshold = 0.0001;
  else if (zoom === 17) threshold = 0.0002;
  else if (zoom === 16) threshold = 0.0004;
  else if (zoom === 15) threshold = 0.0007;
  else if (zoom === 14) threshold = 0.0015;
  else threshold = 0.0030;

  // 1. Détection des doublons géographiques stricts (Immeubles / Centres commerciaux multi-boutiques)
  const exactLocationBuckets = new Map();
  for (const poi of pois) {
    const lat = Number(poi.latitude);
    const lng = Number(poi.longitude);
    if (isNaN(lat) || isNaN(lng)) continue;

    const locKey = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
    if (!exactLocationBuckets.has(locKey)) {
      exactLocationBuckets.set(locKey, []);
    }
    exactLocationBuckets.get(locKey).push({ ...poi });
  }

  const dispersedPois = [];
  exactLocationBuckets.forEach((bucket) => {
    if (bucket.length === 1) {
      dispersedPois.push(bucket[0]);
    } else {
      // Micro-dispersion en rosace (Spiderfy) pour rendre chaque boutique d'un même immeuble cliquable
      const count = bucket.length;
      const radiusDeg = 0.00012; // ~12 mètres de dispersion
      bucket.forEach((item, index) => {
        const angle = (2 * Math.PI * index) / count;
        item.latitude = Number(item.latitude) + radiusDeg * Math.sin(angle);
        item.longitude = Number(item.longitude) + (radiusDeg / Math.cos((Number(item.latitude) * Math.PI) / 180)) * Math.cos(angle);
        dispersedPois.push(item);
      });
    }
  });

  // 2. Gestion intelligente des labels sans JAMAIS supprimer un marqueur
  const processed = [];
  for (let i = 0; i < dispersedPois.length; i++) {
    const current = dispersedPois[i];
    const curLat = Number(current.latitude);
    const curLng = Number(current.longitude);

    let hasCollision = false;
    for (const p of processed) {
      if (p.showLabel === false) continue;
      const pLat = Number(p.latitude);
      const pLng = Number(p.longitude);

      if (Math.abs(curLat - pLat) < threshold && Math.abs(curLng - pLng) < threshold) {
        hasCollision = true;
        break;
      }
    }
    
    current.showLabel = !hasCollision;
    processed.push(current);
  }
  return processed;
};

export const createPoiIcon = (poi) => {
  const cacheKey = `${poi._id || poi.id || poi.name}_${poi.iconColor || ''}_${poi.showLabel !== false}`;
  if (poiIconCache.has(cacheKey)) {
    return poiIconCache.get(cacheKey);
  }

  const color = poi.iconColor || THEME.COLORS.champagneGold;
  const fullName = poi.name || '';
  
  const iconHtml = renderToString(
    <UniversalIcon iconString={poi.icon || 'Ionicons/location'} size={14} color="#FFFFFF" />
  );

  const htmlContent = `
    <div style="display: flex; flex-direction: column; align-items: center; width: 26px; overflow: visible;">
      <div style="width: 26px; height: 26px; border-radius: 13px; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;">
        ${iconHtml}
      </div>
      ${poi.showLabel !== false ? `
      <div style="margin-top: 2px; font-size: 12px; font-weight: 800; color: #121418; text-shadow: 0px 0px 4px rgba(255,255,255,0.9), 0px 0px 2px rgba(255,255,255,1); text-align: center; white-space: nowrap;">
        ${fullName}
      </div>
      ` : ''}
    </div>
  `;

  const icon = L.divIcon({
    className: '', 
    html: htmlContent,
    iconSize: [26, 26],
    iconAnchor: [13, 26], 
  });

  poiIconCache.set(cacheKey, icon);
  return icon;
};

export const createDynamicPoiIcon = (iconString, color) => {
  const cacheKey = `${iconString}_${color}`;
  if (dynamicIconCache.has(cacheKey)) {
    return dynamicIconCache.get(cacheKey);
  }

  const iconHtml = renderToString(
    <UniversalIcon iconString={iconString || 'Ionicons/location'} size={18} color="#FFFFFF" />
  );

  const icon = L.divIcon({
    className: 'yely-dynamic-marker',
    html: `<div style="width: 32px; height: 32px; border-radius: 50%; background: ${color || '#D4AF37'}; border: 2px solid #FFFFFF; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${iconHtml}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  dynamicIconCache.set(cacheKey, icon);
  return icon;
};

export const userIcon = L.divIcon({
  className: 'yely-user-marker',
  html: `<div style="width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; position: relative;"><div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(212, 175, 55, 0.15);"></div><div style="width: 14px; height: 14px; border-radius: 50%; background: #D4AF37; border: 2.5px solid #FFFFFF; z-index: 1;"></div></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export const defaultIcon = L.divIcon({
  className: 'yely-default-marker',
  html: `<div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(18, 20, 24, 0.92); border: 0.5px solid rgba(242, 244, 246, 0.10); display: flex; justify-content: center; align-items: center;">${SVG_PIN}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export const pickupIcon = L.divIcon({
  className: 'yely-pickup-marker',
  html: `<div style="width: 50px; height: 50px; display: flex; justify-content: center; align-items: center; position: relative;"><div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(52, 152, 219, 0.35); animation: yely-pulse 1.4s infinite ease-in-out;"></div><div style="width: 34px; height: 34px; border-radius: 50%; background: #3498DB; border: 2px solid #FFFFFF; display: flex; justify-content: center; align-items: center; z-index: 1; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${SVG_USER}</div><style>@keyframes yely-pulse { 0% { transform: scale(0.8); opacity: 0.3; } 50% { transform: scale(1.3); opacity: 0.7; } 100% { transform: scale(0.8); opacity: 0.3; } }</style></div>`,
  iconSize: [50, 50],
  iconAnchor: [25, 45],
});

export const destinationIcon = L.divIcon({
  className: 'yely-destination-marker',
  html: `<div style="width: 50px; height: 50px; display: flex; justify-content: center; align-items: center; position: relative;"><div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(231, 76, 60, 0.35); animation: yely-dest-pulse 1.6s infinite ease-in-out;"></div><div style="z-index: 1; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">${SVG_FLAG}</div><style>@keyframes yely-dest-pulse { 0% { transform: scale(0.8); opacity: 0.3; } 50% { transform: scale(1.3); opacity: 0.7; } 100% { transform: scale(0.8); opacity: 0.3; } }</style></div>`,
  iconSize: [50, 50],
  iconAnchor: [25, 45],
});

export const pickupOriginIcon = L.divIcon({
  className: 'yely-pickup-origin-marker',
  html: `<div style="width: 20px; height: 20px; border-radius: 50%; background: #D4AF37; border: 2px solid #FFFFFF; opacity: 0.7; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export const driverIcon = L.divIcon({
  className: 'yely-driver-marker',
  html: `<div style="width: 44px; height: 44px; display: flex; justify-content: center; align-items: center;"><div style="width: 36px; height: 36px; border-radius: 50%; background: #1E1E1E; border: 2px solid #D4AF37; display: flex; justify-content: center; align-items: center; box-shadow: 0px 4px 6px rgba(0,0,0,0.3);">${SVG_CAR}</div></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export const MapAutoFitter = ({ 
  location, 
  driverLocation, 
  markers = [], 
  routePoints = [],
  isUserInteracting, 
  mapTopPadding = 140, 
  mapBottomPadding = 240 
}) => {
  const map = useMap();
  const isInitialFitDone = useRef(false);
  const lastUpdateRef = useRef(0);
  const lastRouteSigRef = useRef('');

  useEffect(() => {
    if (isUserInteracting) return;

    let coordsToFit = [];
    const hasDetailedRoute = Array.isArray(routePoints) && routePoints.length > 1;

    if (hasDetailedRoute) {
      coordsToFit = routePoints.map(p => [p.latitude, p.longitude]);
    } else {
      const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
      const destinationMarker = markers.find((m) => m.type === 'destination');
      const pickupMarker = markers.find((m) => m.type === 'pickup');

      const targetMarker = pickupMarker || destinationMarker;
      const hasDriverPosition = driverLocation?.latitude != null && driverLocation?.longitude != null;
      const isManualOriginActive = !!pickupOriginMarker && !hasDriverPosition;

      const originMarker = isManualOriginActive
        ? pickupOriginMarker
        : (hasDriverPosition ? driverLocation : location);

      if (targetMarker && originMarker?.latitude && originMarker?.longitude) {
        coordsToFit = [
          [originMarker.latitude, originMarker.longitude],
          [targetMarker.latitude, targetMarker.longitude],
        ];
      } else if (originMarker?.latitude && originMarker?.longitude) {
        coordsToFit = [[originMarker.latitude, originMarker.longitude]];
        markers.forEach(m => {
          if (m?.latitude && m?.longitude) coordsToFit.push([m.latitude, m.longitude]);
        });
      }
    }

    if (coordsToFit.length === 0) {
      if (!isInitialFitDone.current) {
        map.setView([MAFERE_CENTER.latitude, MAFERE_CENTER.longitude], 15);
        isInitialFitDone.current = true;
      }
      return;
    }

    const firstPt = coordsToFit[0];
    const lastPt = coordsToFit[coordsToFit.length - 1];
    const currentRouteSig = `${firstPt[0]?.toFixed(4)},${firstPt[1]?.toFixed(4)}->${lastPt[0]?.toFixed(4)},${lastPt[1]?.toFixed(4)}`;

    const isRouteChanged = currentRouteSig !== lastRouteSigRef.current;
    const now = Date.now();
    const isTrackingActive = coordsToFit.length >= 2;

    const debounceTime = isRouteChanged ? 0 : (isTrackingActive ? 2500 : 9999999);

    if (isRouteChanged || (now - lastUpdateRef.current > debounceTime)) {
      lastUpdateRef.current = now;
      lastRouteSigRef.current = currentRouteSig;
      isInitialFitDone.current = true;

      const mapContainer = map.getContainer();
      const mapHeight = mapContainer ? mapContainer.clientHeight : 800;
      
      const safeTopPadding = Math.min(mapTopPadding + 20, Math.floor(mapHeight * 0.36));
      const safeBottomPadding = Math.min(mapBottomPadding + 20, Math.floor(mapHeight * 0.44));

      const bounds = L.latLngBounds(coordsToFit);
      map.flyToBounds(bounds, {
        paddingTopLeft: [35, safeTopPadding],
        paddingBottomRight: [35, safeBottomPadding],
        duration: isRouteChanged ? 0.85 : 1.1,
        maxZoom: 15.6,
      });
    }
  }, [markers, routePoints, map, mapTopPadding, mapBottomPadding, location, driverLocation, isUserInteracting]); 

  return null;
};