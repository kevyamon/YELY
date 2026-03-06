// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Caméra Intelligente Conditionnelle (3D Fixe & Anti-Renversement)
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// 🧠 INTELLIGENCE SPATIALE : Formule de Haversine
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
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    
    if (isUserInteracting) return;

    let coordsToFit = [];

    // 🎯 1. IDENTIFICATION DES EXTRÉMITÉS
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
    const debounceTime = isInitialFitDone.current ? (isTrackingActive ? 4000 : 9999999) : 300;

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;
      isInitialFitDone.current = true;

      // 🛡️ 2. LE BOUCLIER D'ÉVASION (Anti-Implosion)
      const maxAllowedPadding = SCREEN_HEIGHT * 0.35; 
      const dynamicTop = Math.min(mapTopPadding + 40, maxAllowedPadding);
      const dynamicBottom = Math.min(mapBottomPadding + 40, maxAllowedPadding);

      // 🧠 3. DÉCISION DU SUPERPOUVOIR
      let shouldActivateSuperpower = false;

      if (isTrackingActive && targetMarker && originMarker) {
        const distance = getDistance(
          originMarker.latitude, originMarker.longitude,
          targetMarker.latitude, targetMarker.longitude
        );

        if (distance > 800) {
          shouldActivateSuperpower = true;
        }
        // Suppression du calcul de l'angle (heading) pour éviter le renversement
      }

      const delay = Platform.OS === 'ios' ? 100 : 250;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setTimeout(() => {
        if (!mapRef.current) return;

        // ÉTAPE 1 : Glissement de la carte
        mapRef.current.fitToCoordinates(coordsToFit, {
          edgePadding: {
            top: dynamicTop,
            bottom: dynamicBottom,
            left: SCREEN_WIDTH * 0.12,
            right: SCREEN_WIDTH * 0.12,
          },
          animated: true,
        });

        // ÉTAPE 2 : LE SUPERPOUVOIR CONDITIONNÉ (Sans rotation vertigineuse)
        if (isTrackingActive) {
          timeoutRef.current = setTimeout(() => {
            if (mapRef.current && !isUserInteracting) {
              if (shouldActivateSuperpower) {
                // Inclinaison 3D pure, on ne touche plus au "heading" !
                mapRef.current.animateCamera({
                  pitch: 45,     
                }, { duration: 1000 });
              } else {
                mapRef.current.animateCamera({
                  pitch: 0, 
                }, { duration: 800 });
              }
            }
          }, 1500); 
        }
      }, delay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, isUserInteracting, mapRef]);
};

export default useMapAutoFitter;