// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Caméra Intelligente et Respectueuse
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
    const hasRoute = routePointsToFit && routePointsToFit.length > 0;

    if (hasRoute) {
      // S'il y a un tracé, on doit suivre la course
      coordsToFit = routePointsToFit;
    } else {
      // LIBÉRATION DE LA CAMÉRA : S'il n'y a pas de course en cours, on cadre 
      // UNE SEULE FOIS à l'ouverture, puis on laisse l'utilisateur scroller librement.
      if (isInitialFitDone.current) {
        return; 
      }

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
    // On met à jour la caméra toutes les 4 secondes UNIQUEMENT si une course est active (hasRoute).
    const debounceTime = isInitialFitDone.current ? 4000 : 300; 

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;
      isInitialFitDone.current = true;

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordsToFit, {
          edgePadding: {
            top: mapTopPadding + 50,
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