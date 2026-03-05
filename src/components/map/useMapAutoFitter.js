// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Contrôleur de Caméra Silencieux (Cadrage et Zoom)
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const useMapAutoFitter = ({
  isMapReady,
  mapRef,
  location,
  driverLocation,
  markers,
  fullRoutePoints,
  mapTopPadding,
  mapBottomPadding,
}) => {
  const lastCameraSignatureRef = useRef('');

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    const allCoords = [];
    
    // 1. Collecte des points à afficher
    if (location?.latitude && location?.longitude) {
      allCoords.push({ latitude: location.latitude, longitude: location.longitude });
    }
    if (driverLocation?.latitude && driverLocation?.longitude) {
      allCoords.push({ latitude: driverLocation.latitude, longitude: driverLocation.longitude });
    }
    markers.forEach(m => {
      if (m.latitude && m.longitude) {
        allCoords.push({ latitude: m.latitude, longitude: m.longitude });
      }
    });
    if (fullRoutePoints && fullRoutePoints.length > 0) {
      allCoords.push(...fullRoutePoints);
    }

    // 2. Détermination de l'objectif principal (pour la signature)
    const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
    const destinationMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');
    const activeTarget = pickupOriginMarker ? destinationMarker : (pickupMarker || destinationMarker);

    // 3. Signature unique pour bloquer les recalculs inutiles (Le secret anti-clignotement)
    const routeKey = fullRoutePoints && fullRoutePoints.length > 0 ? `ROUTE_${fullRoutePoints.length}` : 'NO_ROUTE';
    const locKey = location ? `${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}` : 'NO_LOC';
    const driverKey = driverLocation ? `${driverLocation.latitude.toFixed(3)}_${driverLocation.longitude.toFixed(3)}` : 'NO_DRIVER';
    
    const currentSignature = `SIG_${activeTarget?.type || 'IDLE'}_${routeKey}_${locKey}_${driverKey}`;

    if (lastCameraSignatureRef.current !== currentSignature) {
      lastCameraSignatureRef.current = currentSignature;

      if (allCoords.length > 1) {
        const timer = setTimeout(() => {
          mapRef.current?.fitToCoordinates(allCoords, {
            edgePadding: { 
              top: mapTopPadding + 20, 
              right: 50, 
              bottom: mapBottomPadding + 20, 
              left: 50 
            },
            animated: true
          });
        }, 600);
        return () => clearTimeout(timer);
      } else if (allCoords.length === 1) {
        const timer = setTimeout(() => {
          mapRef.current?.animateToRegion(
            { 
              latitude: allCoords[0].latitude, 
              longitude: allCoords[0].longitude, 
              latitudeDelta: 0.01, 
              longitudeDelta: 0.01 
            },
            800
          );
        }, 600);
        return () => clearTimeout(timer);
      } else if (allCoords.length === 0) {
        // Fallback sécurisé sur Maféré
        const timer = setTimeout(() => {
            mapRef.current?.animateToRegion(
              { 
                latitude: MAFERE_CENTER.latitude, 
                longitude: MAFERE_CENTER.longitude, 
                latitudeDelta: 0.02, 
                longitudeDelta: 0.02 
              },
              800
            );
          }, 600);
          return () => clearTimeout(timer);
      }
    }
  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, fullRoutePoints, mapRef]);
};

export default useMapAutoFitter;