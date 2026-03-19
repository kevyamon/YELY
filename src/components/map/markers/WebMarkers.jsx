// src/components/map/markers/WebMarkers.jsx
// COMPOSANTS VISUELS CARTE WEB - Intelligence Spatiale & Cadrage Sécurisé (AFE Standard)
// CSCSM Level: Bank Grade

import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import { useMap } from 'react-leaflet';
import { MAFERE_CENTER } from '../../../utils/mafereZone';
import UniversalIcon from '../../ui/UniversalIcon'; // AJOUT : Import du composant

const SVG_PIN = `<svg viewBox="0 0 24 24" fill="#D4AF37" width="20" height="20"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
const SVG_USER = `<svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
const SVG_FLAG = `<svg viewBox="0 0 24 24" fill="#E74C3C" width="26" height="26"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>`;
const SVG_CAR = `<svg viewBox="0 0 24 24" fill="#D4AF37" width="22" height="22"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;

// AJOUT MAJEUR : Générateur dynamique d'icônes Leaflet (Transforme le React en HTML)
export const createDynamicPoiIcon = (iconString, color) => {
  // On utilise renderToString pour compiler le composant avant de le donner à Leaflet
  const iconHtml = renderToString(
    <UniversalIcon iconString={iconString || 'Ionicons/location'} size={18} color="#FFFFFF" />
  );

  return L.divIcon({
    className: 'yely-dynamic-marker',
    html: `<div style="width: 32px; height: 32px; border-radius: 50%; background: ${color || '#D4AF37'}; border: 2px solid #FFFFFF; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${iconHtml}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
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

// 🧠 INTELLIGENCE SPATIALE : Formule de Haversine
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export const MapAutoFitter = ({ 
  location, 
  driverLocation, 
  markers, 
  isUserInteracting, 
  mapTopPadding = 140, 
  mapBottomPadding = 240 
}) => {
  const map = useMap();
  const isInitialFitDone = useRef(false);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (isUserInteracting) return;

    let coordsToFit = [];

    const targetMarker = markers.find((m) => m.type === 'pickup' || m.type === 'destination');
    const originMarker = driverLocation?.latitude ? driverLocation : location;

    if (targetMarker && originMarker) {
      coordsToFit = [
        [originMarker.latitude, originMarker.longitude],
        [targetMarker.latitude, targetMarker.longitude],
      ];
    } else if (originMarker) {
      coordsToFit = [[originMarker.latitude, originMarker.longitude]];
      markers.forEach(m => {
        if (m.latitude && m.longitude) coordsToFit.push([m.latitude, m.longitude]);
      });
    }

    if (coordsToFit.length === 0) {
      if (!isInitialFitDone.current) {
        map.setView([MAFERE_CENTER.latitude, MAFERE_CENTER.longitude], 15);
        isInitialFitDone.current = true;
      }
      return;
    }

    const now = Date.now();
    const isTrackingActive = coordsToFit.length === 2;
    const debounceTime = isInitialFitDone.current ? (isTrackingActive ? 4000 : 9999999) : 300; 

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;
      isInitialFitDone.current = true;

      let dynamicMaxZoom = 16; 

      if (isTrackingActive && targetMarker && originMarker) {
        const distance = getDistance(
          originMarker.latitude, originMarker.longitude,
          targetMarker.latitude, targetMarker.longitude
        );

        if (distance < 800) {
          dynamicMaxZoom = 17;
        } else {
          dynamicMaxZoom = 15;
        }

        if (distance < 150) {
            map.flyTo([originMarker.latitude, originMarker.longitude], 17, { duration: 1 });
            return;
        }
      }

      const mapContainer = map.getContainer();
      const mapHeight = mapContainer ? mapContainer.clientHeight : 800;
      
      const maxAllowedTop = Math.floor(mapHeight * 0.35);
      const maxAllowedBottom = Math.floor(mapHeight * 0.45);

      const safeTopPadding = Math.min(mapTopPadding, maxAllowedTop); 
      const safeBottomPadding = Math.min(mapBottomPadding, maxAllowedBottom);

      setTimeout(() => {
        const bounds = L.latLngBounds(coordsToFit);
        map.flyToBounds(bounds, {
          paddingTopLeft: [0, safeTopPadding],
          paddingBottomRight: [0, safeBottomPadding],
          duration: 1.5,
          maxZoom: dynamicMaxZoom,
        });
      }, 100);
    }
  }, [markers, map, mapTopPadding, mapBottomPadding, location, driverLocation, isUserInteracting]); 

  return null;
};