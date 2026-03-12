// src/hooks/useMapFitter.js
// HOOK CARTE NATIF - Caméra Intelligente MapLibre (Bounding Box & Anti-Eclipse UI)
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import { MAFERE_CENTER } from '../utils/mafereZone';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const useMapFitter = ({
  isMapReady,
  cameraRef,
  location,
  driverLocation,
  markers,
  mapTopPadding = 140,
  mapBottomPadding = 240,
  isUserInteracting,
}) => {
  const lastUpdateRef = useRef(0);
  const isInitialFitDone = useRef(false);

  useEffect(() => {
    if (!isMapReady || !cameraRef.current) return;
    if (isUserInteracting) return;

    let coordsToFit = [];

    const targetMarker = markers.find(m => m.type === 'destination' || m.type === 'pickup');
    const originMarker = driverLocation?.latitude ? driverLocation : location;

    if (targetMarker && originMarker) {
      coordsToFit = [
        { latitude: originMarker.latitude, longitude: originMarker.longitude },
        { latitude: targetMarker.latitude, longitude: targetMarker.longitude }
      ];

      if (Math.abs(originMarker.latitude - targetMarker.latitude) < 0.00005) {
        coordsToFit.push({ latitude: originMarker.latitude + 0.0001, longitude: originMarker.longitude });
      }
      if (Math.abs(originMarker.longitude - targetMarker.longitude) < 0.00005) {
        coordsToFit.push({ latitude: originMarker.latitude, longitude: originMarker.longitude + 0.0001 });
      }
    } else if (originMarker) {
      coordsToFit.push({ latitude: originMarker.latitude, longitude: originMarker.longitude });
      markers.forEach(m => {
        if (m.latitude && m.longitude) coordsToFit.push({ latitude: m.latitude, longitude: m.longitude });
      });
    }

    if (coordsToFit.length === 0) {
      if (!isInitialFitDone.current) {
        cameraRef.current?.setCamera({
          centerCoordinate: [MAFERE_CENTER.longitude, MAFERE_CENTER.latitude],
          zoomLevel: 14,
          animationDuration: 800
        });
        isInitialFitDone.current = true;
      }
      return;
    }

    const now = Date.now();
    const isTrackingActive = coordsToFit.length >= 2;
    const debounceTime = isInitialFitDone.current ? (isTrackingActive ? 4000 : 300) : 300;

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;
      isInitialFitDone.current = true;

      let safeTop = mapTopPadding + 40;
      let safeBottom = mapBottomPadding + 40;
      
      const maxAllowed = SCREEN_HEIGHT * 0.75;
      if (safeTop + safeBottom > maxAllowed) {
          const ratio = maxAllowed / (safeTop + safeBottom);
          safeTop *= ratio;
          safeBottom *= ratio;
      }

      const lats = coordsToFit.map(c => c.latitude);
      const lngs = coordsToFit.map(c => c.longitude);
      const maxLat = Math.max(...lats);
      const minLat = Math.min(...lats);
      const maxLng = Math.max(...lngs);
      const minLng = Math.min(...lngs);

      setTimeout(() => {
        if (cameraRef.current) {
          cameraRef.current.fitBounds(
            [maxLng, maxLat],
            [minLng, minLat],
            [safeTop, 50, safeBottom, 50],
            800
          );
        }
      }, 100);
    }

  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, isUserInteracting, cameraRef]);
};

export default useMapFitter;