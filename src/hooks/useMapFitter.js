// src/hooks/useMapFitter.js
// HOOK CARTE NATIF - Camera Intelligente Conditionnelle MapLibre (3D Fixe & Anti-Renversement)
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import { MAFERE_CENTER } from '../utils/mafereZone';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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

const useMapAutoFitter = ({
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
  const timeoutRef = useRef(null);

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
    const debounceTime = isInitialFitDone.current ? (isTrackingActive ? 4000 : 9999999) : 300;

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;

      const delay = Platform.OS === 'ios' ? 100 : 250;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (!cameraRef.current || isUserInteracting) return;

        const maxAllowedPadding = SCREEN_HEIGHT * 0.35; 
        const dynamicTop = Math.min(mapTopPadding + 40, maxAllowedPadding);
        const dynamicBottom = Math.min(mapBottomPadding + 40, maxAllowedPadding);

        if (coordsToFit.length === 1) {
          cameraRef.current.setCamera({
            centerCoordinate: [coordsToFit[0].longitude, coordsToFit[0].latitude],
            zoomLevel: 15,
            padding: {
              paddingTop: mapTopPadding,
              paddingBottom: mapBottomPadding,
              paddingLeft: 0,
              paddingRight: 0
            },
            animationDuration: isInitialFitDone.current ? 1000 : 2000,
          });
          isInitialFitDone.current = true;
          return;
        }

        let shouldActivateSuperpower = false;

        if (isTrackingActive && targetMarker && originMarker) {
          const distance = getDistance(
            originMarker.latitude, originMarker.longitude,
            targetMarker.latitude, targetMarker.longitude
          );

          if (distance < 600 || distance > 800) {
            shouldActivateSuperpower = true;
          }
        }

        const lats = coordsToFit.map(c => c.latitude);
        const lngs = coordsToFit.map(c => c.longitude);
        const sw = [Math.min(...lngs), Math.min(...lats)];
        const ne = [Math.max(...lngs), Math.max(...lats)];

        cameraRef.current.setCamera({
          bounds: {
            ne,
            sw,
            paddingTop: shouldActivateSuperpower ? dynamicTop + 40 : dynamicTop,
            paddingBottom: shouldActivateSuperpower ? dynamicBottom + 40 : dynamicBottom,
            paddingLeft: SCREEN_WIDTH * 0.12,
            paddingRight: SCREEN_WIDTH * 0.12,
          },
          pitch: shouldActivateSuperpower ? 45 : 0,
          animationDuration: 1000,
        });

        isInitialFitDone.current = true;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, isUserInteracting, cameraRef]);
};

export default useMapAutoFitter;