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
    
    const debounceTime = isInitialFitDone.current ? 4000 : 300;

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;

      const delay = Platform.OS === 'ios' ? 100 : 250;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (!cameraRef.current || isUserInteracting) return;

        // Augmentation de la capacité de padding pour éviter que le tracé soit caché par les panneaux
        const maxAllowedPaddingTop = SCREEN_HEIGHT * 0.25;
        const maxAllowedPaddingBottom = SCREEN_HEIGHT * 0.45;
        
        const dynamicTop = Math.min(mapTopPadding, maxAllowedPaddingTop);
        const dynamicBottom = Math.min(mapBottomPadding, maxAllowedPaddingBottom);

        if (coordsToFit.length === 1) {
          cameraRef.current.setCamera({
            centerCoordinate: [coordsToFit[0].longitude, coordsToFit[0].latitude],
            zoomLevel: 15,
            padding: {
              paddingTop: dynamicTop,
              paddingBottom: dynamicBottom,
              paddingLeft: 0,
              paddingRight: 0
            },
            animationDuration: isInitialFitDone.current ? 1000 : 2000,
          });
          isInitialFitDone.current = true;
          return;
        }

        if (isTrackingActive && targetMarker && originMarker) {
          const distance = getDistance(
            originMarker.latitude, originMarker.longitude,
            targetMarker.latitude, targetMarker.longitude
          );

          // Si les points sont trop proches, l'utilisation de bounds cause un bug de calcul MapLibre. On centre.
          if (distance < 150) {
             cameraRef.current.setCamera({
                centerCoordinate: [originMarker.longitude, originMarker.latitude],
                zoomLevel: 16,
                padding: { paddingTop: dynamicTop, paddingBottom: dynamicBottom, paddingLeft: 0, paddingRight: 0 },
                animationDuration: 1000
             });
             isInitialFitDone.current = true;
             return;
          }
        }

        const lats = coordsToFit.map(c => c.latitude);
        const lngs = coordsToFit.map(c => c.longitude);
        const sw = [Math.min(...lngs), Math.min(...lats)];
        const ne = [Math.max(...lngs), Math.max(...lats)];

        // Sécurité contre le crash Android si les bounds sont identiques
        if (sw[0] === ne[0] && sw[1] === ne[1]) return;

        cameraRef.current.setCamera({
          bounds: {
            ne,
            sw,
            paddingTop: dynamicTop + 30,
            paddingBottom: dynamicBottom + 30,
            paddingLeft: SCREEN_WIDTH * 0.1,
            paddingRight: SCREEN_WIDTH * 0.1,
          },
          pitch: 0, // Désactivation du pitch auto pour conserver une visibilité aérienne du tracé
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

export default useMapFitter;