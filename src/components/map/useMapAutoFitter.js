// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Contrôleur de Caméra Silencieux (Cadrage Dynamique Actif)
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const useMapAutoFitter = ({
  isMapReady,
  mapRef,
  location,
  driverLocation,
  markers,
  routePointsToFit,
  mapTopPadding,
  mapBottomPadding,
}) => {
  const lastUpdateRef = useRef(0);
  const lastSignatureRef = useRef('');

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    const allCoords = [];
    
    // 1. Détermination de la Source active
    const activeSource = (driverLocation?.latitude && driverLocation?.longitude) 
      ? driverLocation 
      : (location?.latitude && location?.longitude) ? location : null;

    // 2. Détermination de la Cible active
    const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
    const destinationMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');
    const activeTarget = pickupOriginMarker ? destinationMarker : (pickupMarker || destinationMarker);

    // 3. Collecte stricte des points vitaux
    if (activeSource) {
      allCoords.push({ latitude: activeSource.latitude, longitude: activeSource.longitude });
    }
    if (activeTarget) {
      allCoords.push({ latitude: activeTarget.latitude, longitude: activeTarget.longitude });
    }

    // 4. Ajout de L'INTÉGRALITÉ du tracé anticipé pour cibler la fin du zoom directement
    if (routePointsToFit && routePointsToFit.length > 0) {
      allCoords.push(...routePointsToFit);
    } else {
      markers.forEach(m => {
        if (m.latitude && m.longitude) {
          allCoords.push({ latitude: m.latitude, longitude: m.longitude });
        }
      });
    }

    // Gestion des cas extrêmes
    if (allCoords.length === 0) {
      mapRef.current?.animateToRegion({ 
        latitude: MAFERE_CENTER.latitude, 
        longitude: MAFERE_CENTER.longitude, 
        latitudeDelta: 0.02, 
        longitudeDelta: 0.02 
      }, 800);
      return;
    }

    if (allCoords.length === 1) {
      mapRef.current?.animateToRegion({ 
        latitude: allCoords[0].latitude, 
        longitude: allCoords[0].longitude, 
        latitudeDelta: 0.005, 
        longitudeDelta: 0.005 
      }, 800);
      return;
    }

    // 5. Calcul mathématique de la Bounding Box totale
    let minLat = allCoords[0].latitude;
    let maxLat = allCoords[0].latitude;
    let minLng = allCoords[0].longitude;
    let maxLng = allCoords[0].longitude;

    for (let i = 1; i < allCoords.length; i++) {
      if (allCoords[i].latitude < minLat) minLat = allCoords[i].latitude;
      if (allCoords[i].latitude > maxLat) maxLat = allCoords[i].latitude;
      if (allCoords[i].longitude < minLng) minLng = allCoords[i].longitude;
      if (allCoords[i].longitude > maxLng) maxLng = allCoords[i].longitude;
    }

    // 6. Cadrage Dynamique Actif (Auto-Zoom fluide)
    const boxWidth = maxLng - minLng;
    const boxHeight = maxLat - minLat;
    
    // Marges de respiration pour ne pas coller la route aux bords de l'écran
    const PAD_FACTOR = 1.5; 
    const MIN_DELTA = 0.004;

    const baseLatDelta = Math.max(boxHeight * PAD_FACTOR, MIN_DELTA);
    const baseLngDelta = Math.max(boxWidth * PAD_FACTOR, MIN_DELTA);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // 7. Compensation visuelle des panneaux UI
    const paddingOffsetRatio = (mapBottomPadding - mapTopPadding) / 1000;
    const adjustedCenterLat = centerLat - (baseLatDelta * paddingOffsetRatio * 0.4);

    // 8. Signature continue et anti-spam
    const now = Date.now();
    const currentSignature = `${adjustedCenterLat.toFixed(3)}_${centerLng.toFixed(3)}_${baseLatDelta.toFixed(3)}`;

    // Mise à jour si la Bounding Box a changé significativement OU toutes les 3.5 secondes
    if (lastSignatureRef.current !== currentSignature || (now - lastUpdateRef.current > 3500)) {
      lastSignatureRef.current = currentSignature;
      lastUpdateRef.current = now;

      const timer = setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: adjustedCenterLat,
          longitude: centerLng,
          latitudeDelta: baseLatDelta,
          longitudeDelta: baseLngDelta
        }, 1500); // Modifié : 1500ms, aligné exactement avec le temps de dessin de la ligne
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, routePointsToFit, mapRef]);
};

export default useMapAutoFitter;