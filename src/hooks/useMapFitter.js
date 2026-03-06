// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Caméra Intelligente (Logique Extrémités + Anti-Eclipse UI)
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const useMapAutoFitter = ({
  isMapReady,
  mapRef,
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
    if (!isMapReady || !mapRef.current) return;
    
    if (isUserInteracting) return;

    let coordsToFit = [];

    const targetMarker = markers.find(m => m.type === 'destination' || m.type === 'pickup');
    const originMarker = driverLocation?.latitude ? driverLocation : location;

    if (targetMarker && originMarker) {
      coordsToFit = [
        { latitude: originMarker.latitude, longitude: originMarker.longitude },
        { latitude: targetMarker.latitude, longitude: targetMarker.longitude }
      ];

      // 🛡️ ANTI-ALIGNEMENT MORTEL : Si les 2 points sont sur la même ligne exacte, le SDK panique.
      // On ajoute un faux 3e point invisible, décalé de quelques mètres, pour forcer une vraie BoundingBox.
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
    const isTrackingActive = coordsToFit.length >= 2;
    const debounceTime = isInitialFitDone.current ? (isTrackingActive ? 4000 : 9999999) : 300;

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;
      isInitialFitDone.current = true;

      // 🛡️ ANTI-ECLIPSE UI : 
      // On prend exactement la taille de tes menus (+20px de respiration pour que le point ne touche pas le bord)
      let safeTop = mapTopPadding + 20;
      let safeBottom = mapBottomPadding + 20;
      
      // Sécurité ultime anti-crash : Les menus ne doivent pas dépasser 80% de l'écran
      const maxAllowed = SCREEN_HEIGHT * 0.8;
      if (safeTop + safeBottom > maxAllowed) {
          const ratio = maxAllowed / (safeTop + safeBottom);
          safeTop *= ratio;
          safeBottom *= ratio;
      }

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordsToFit, {
          edgePadding: {
            top: safeTop,
            bottom: safeBottom,
            left: 40,
            right: 40,
          },
          animated: true,
        });
      }, 100);
    }

  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, isUserInteracting, mapRef]);
};

export default useMapAutoFitter;