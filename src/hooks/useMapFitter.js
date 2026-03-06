// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Caméra Intelligente (Logique des Extrémités & Respect UX)
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const useMapAutoFitter = ({
  isMapReady,
  mapRef,
  location,
  driverLocation,
  markers,
  mapTopPadding,
  mapBottomPadding,
  isUserInteracting, // NOUVEAU : Le verrou qui te rend le pouvoir
}) => {
  const lastUpdateRef = useRef(0);
  const isInitialFitDone = useRef(false);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    
    // 🛡️ RESPECT DE L'UX : Si tu touches la carte, la machine se tait.
    if (isUserInteracting) return;

    let coordsToFit = [];

    // 🎯 LA LOGIQUE DES EXTRÉMITÉS (Secret Uber/Yango)
    // On ignore les 150 points de la courbe de la route. On isole 2 bornes strictes.
    const targetMarker = markers.find(m => m.type === 'destination' || m.type === 'pickup');
    const originMarker = driverLocation?.latitude ? driverLocation : location;

    if (targetMarker && originMarker) {
      // Cas 1 : Course en cours. 
      // La BoundingBox ne contient que le mobile et la cible. Plus ils se rapprochent, plus ça zoome.
      coordsToFit = [
        { latitude: originMarker.latitude, longitude: originMarker.longitude },
        { latitude: targetMarker.latitude, longitude: targetMarker.longitude }
      ];
    } else if (originMarker) {
      // Cas 2 : Mode Attente/Recherche. On cadre sur toi et les POIs.
      coordsToFit.push({ latitude: originMarker.latitude, longitude: originMarker.longitude });
      markers.forEach(m => {
        if (m.latitude && m.longitude) coordsToFit.push({ latitude: m.latitude, longitude: m.longitude });
      });
    }

    if (coordsToFit.length === 0) {
      if (!isInitialFitDone.current) {
        mapRef.current?.animateToRegion({ 
          latitude: MAFERE_CENTER.latitude, 
          longitude: MAFERE_CENTER.longitude, 
          latitudeDelta: 0.02, 
          longitudeDelta: 0.02 
        }, 800);
        isInitialFitDone.current = true;
      }
      return;
    }

    const now = Date.now();
    const isTrackingActive = coordsToFit.length === 2;
    // Cadence : Rafraîchissement souple en cours de route, sinon 1 seul cadrage.
    const debounceTime = isInitialFitDone.current ? (isTrackingActive ? 4000 : 9999999) : 300; 

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;
      isInitialFitDone.current = true;

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordsToFit, {
          edgePadding: {
            top: mapTopPadding + 50,    // La marge prend en compte le Header intelligent
            bottom: mapBottomPadding + 50, // La marge prend en compte le Footer intelligent
            left: 50,
            right: 50,
          },
          animated: true,
        });
      }, 100);
    }

  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, isUserInteracting, mapRef]);
};

export default useMapAutoFitter;