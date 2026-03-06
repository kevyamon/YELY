// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Caméra Intelligente (Logique des Extrémités & Padding Sécurisé)
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
  isUserInteracting, // Hérité de MapCard pour la liberté gestuelle
}) => {
  const lastUpdateRef = useRef(0);
  const isInitialFitDone = useRef(false);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    
    // 🛡️ RESPECT DE L'UX : Si l'utilisateur manipule la carte, on stoppe la caméra
    if (isUserInteracting) return;

    let coordsToFit = [];

    // 🎯 1. LA LOGIQUE DES EXTRÉMITÉS (Le Secret de l'UX Yango/Uber)
    // On ignore le tracé complet, on ne cible que l'Origine (Point A) et la Cible (Point B)
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
    // Cadence : Rafraîchissement souple pendant une course, sinon un seul cadrage initial.
    const debounceTime = isInitialFitDone.current ? (isTrackingActive ? 4000 : 9999999) : 300;

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;
      isInitialFitDone.current = true;

      // 🛡️ 2. LE BOUCLIER ANTI-PANIC (Correctif du "Zoom In")
      // On s'assure que le padding ne sature jamais l'écran du téléphone pour éviter le crash natif
      const maxSafePadding = SCREEN_HEIGHT * 0.25; // Le padding ne doit pas dépasser 25% de la hauteur de l'écran
      const safeTop = Math.min(mapTopPadding + 10, maxSafePadding);
      const safeBottom = Math.min(mapBottomPadding + 20, maxSafePadding);

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordsToFit, {
          edgePadding: {
            top: safeTop,
            bottom: safeBottom,
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