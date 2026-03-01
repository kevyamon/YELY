// src/components/map/markers/WebMarkers.jsx
// COMPOSANTS VISUELS CARTE WEB - Isolation des SVG Leaflet et AutoFitter
// CSCSM Level: Bank Grade

import L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Icones vectorielles pures (SVG) pour la version Web
const SVG_PIN = `<svg viewBox="0 0 24 24" fill="#D4AF37" width="20" height="20"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
const SVG_USER = `<svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
const SVG_FLAG = `<svg viewBox="0 0 24 24" fill="#E74C3C" width="26" height="26"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>`;
const SVG_CAR = `<svg viewBox="0 0 24 24" fill="#D4AF37" width="22" height="22"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;

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

// Extracteur logique de la camera Leaflet
export const MapAutoFitter = ({ location, driverLocation, markers }) => {
  const map = useMap();

  useEffect(() => {
    const pickupMarker = markers.find((m) => m.type === 'pickup');
    const destMarker = markers.find((m) => m.type === 'destination');
    const activeTarget = pickupMarker || destMarker;

    if (activeTarget) {
      const boundsOrigin = driverLocation?.latitude ? driverLocation : location;
      if (boundsOrigin) {
        const bounds = L.latLngBounds([
          [boundsOrigin.latitude, boundsOrigin.longitude],
          [activeTarget.latitude, activeTarget.longitude],
        ]);
        setTimeout(() => {
          map.flyToBounds(bounds, {
            paddingTopLeft: [50, 150],
            paddingBottomRight: [50, 350],
            duration: 1.5,
            maxZoom: 16,
          });
        }, 300);
      }
      return;
    }

    if (location && markers.length === 0) {
      setTimeout(() => {
        map.flyTo([location.latitude, location.longitude], 15, { duration: 1.2 });
      }, 300);
    }
  }, [location, driverLocation, markers, map]);

  return null;
};