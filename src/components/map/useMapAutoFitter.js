// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Caméra Intelligente (Cadrage Absolu et Paddings Dynamiques)
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
  const isInitialFitDone = useRef(false);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    let coordsToFit = [];

    // 1. RÈGLE D'OR : Si un tracé existe, la caméra DOIT englober toutes ses extrémités
    if (routePointsToFit && routePointsToFit.length > 0) {
      coordsToFit = routePointsToFit;
    } else {
      // 2. S'il n'y a pas de tracé (ex: mode attente), on cadre sur le chauffeur/client et les POI
      if (driverLocation?.latitude) {
        coordsToFit.push({ latitude: driverLocation.latitude, longitude: driverLocation.longitude });
      } else if (location?.latitude) {
        coordsToFit.push({ latitude: location.latitude, longitude: location.longitude });
      }

      markers.forEach(m => {
        if (m.latitude && m.longitude) {
          coordsToFit.push({ latitude: m.latitude, longitude: m.longitude });
        }
      });
    }

    // Sécurité de base si aucune coordonnée
    if (coordsToFit.length === 0) {
      mapRef.current?.animateToRegion({ 
        latitude: MAFERE_CENTER.latitude, 
        longitude: MAFERE_CENTER.longitude, 
        latitudeDelta: 0.02, 
        longitudeDelta: 0.02 
      }, 800);
      return;
    }

    // 3. Cadence de la Caméra (Anti-Spam)
    // Au premier chargement, on cadre très vite. Ensuite, on ajuste toutes les 3 secondes si le chauffeur avance.
    const now = Date.now();
    const debounceTime = isInitialFitDone.current ? 3000 : 300; 

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;
      isInitialFitDone.current = true;

      setTimeout(() => {
        // 🔥 LE MOTEUR D'AUTO-ZOOM NATIF 🔥
        // Demande au SDK natif de calculer le zoom parfait pour inclure TOUS les points
        // tout en évitant de cacher la route sous le SmartHeader (top) et le SmartFooter (bottom).
        mapRef.current?.fitToCoordinates(coordsToFit, {
          edgePadding: {
            top: mapTopPadding + 50,    // +50 pour une respiration visuelle premium
            bottom: mapBottomPadding + 50,
            left: 40,
            right: 40,
          },
          animated: true,
        });
      }, 100);
    }

  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, routePointsToFit, mapRef]);
};

export default useMapAutoFitter;