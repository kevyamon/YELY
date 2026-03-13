// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Camera Intelligente Conditionnelle MapLibre
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const useMapAutoFitter = ({
  isMapReady,
  cameraRef,
  location,
  driverLocation,
  markers = [],
  mapTopPadding = 180, // Espace garanti pour le SmartHeader
  mapBottomPadding = 320, // Espace garanti pour le SmartFooter
  isUserInteracting,
}) => {
  const lastUpdateRef = useRef(0);
  const isInitialFitDone = useRef(false);
  const timeoutRef = useRef(null);
  const interactionPauseRef = useRef(false);
  const resumeTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isMapReady || !cameraRef.current) return;

    // 1. GESTION DE L'INTERACTION UTILISATEUR (Anti-frustration)
    // Si l'utilisateur touche la carte, on bloque le zoom automatique.
    if (isUserInteracting) {
      interactionPauseRef.current = true;
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      return;
    }

    // S'il a fini de toucher, on attend 8 secondes avant de reprendre le controle
    if (interactionPauseRef.current) {
      if (!resumeTimeoutRef.current) {
        resumeTimeoutRef.current = setTimeout(() => {
          interactionPauseRef.current = false;
          resumeTimeoutRef.current = null;
        }, 8000);
      }
      return;
    }

    // 2. SELECTION INTELLIGENTE DES POINTS A AFFICHER
    // Pour eviter le chaos des "3 icones", on cible uniquement l'origine et la cible actuelle.
    let coordsToFit = [];

    // La cible prioritaire : Le point de ramassage, ou a defaut la destination
    const pickupMarker = markers.find(m => m.type === 'pickup');
    const destMarker = markers.find(m => m.type === 'destination');
    const targetMarker = pickupMarker || destMarker;

    // L'origine : La position du chauffeur s'il est la, sinon la position du passager
    const originMarker = driverLocation?.latitude ? driverLocation : location;

    if (targetMarker && originMarker) {
      coordsToFit = [
        { latitude: originMarker.latitude, longitude: originMarker.longitude },
        { latitude: targetMarker.latitude, longitude: targetMarker.longitude }
      ];
    } else if (originMarker) {
      coordsToFit = [{ latitude: originMarker.latitude, longitude: originMarker.longitude }];
    }

    // 3. CENTRAGE PAR DEFAUT SI AUCUN POINT
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

    // 4. APPLICATION DU ZOOM AVEC ESPACEMENT SECURISE (Debounce)
    const now = Date.now();
    const debounceTime = isInitialFitDone.current ? 5000 : 300; // Calme les mises a jour

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (!cameraRef.current || isUserInteracting || interactionPauseRef.current) return;

        // Protection pour ne pas ecraser l'ecran si le padding demande est trop grand
        const maxAllowedPaddingTop = SCREEN_HEIGHT * 0.40;
        const maxAllowedPaddingBottom = SCREEN_HEIGHT * 0.45;
        const safeTop = Math.min(mapTopPadding, maxAllowedPaddingTop);
        const safeBottom = Math.min(mapBottomPadding, maxAllowedPaddingBottom);

        if (coordsToFit.length === 1) {
          // Un seul point : Zoom agreable et fixe
          cameraRef.current.setCamera({
            centerCoordinate: [coordsToFit[0].longitude, coordsToFit[0].latitude],
            zoomLevel: 14, // Plus de recul pour voir les rues autour
            padding: {
              paddingTop: safeTop,
              paddingBottom: safeBottom,
              paddingLeft: 0,
              paddingRight: 0
            },
            animationDuration: 1500,
          });
        } else {
          // Deux points (Trajet) : On englobe tout avec des marges
          const lats = coordsToFit.map(c => c.latitude);
          const lngs = coordsToFit.map(c => c.longitude);
          const sw = [Math.min(...lngs), Math.min(...lats)];
          const ne = [Math.max(...lngs), Math.max(...lats)];

          cameraRef.current.setCamera({
            bounds: {
              ne,
              sw,
              paddingTop: safeTop + 40, // +40 pour respirer sous le header
              paddingBottom: safeBottom + 40, // +40 pour respirer au dessus du footer
              paddingLeft: SCREEN_WIDTH * 0.15,
              paddingRight: SCREEN_WIDTH * 0.15,
            },
            pitch: 0, // Vue de haut stricte pour voir tout le trace sans deformation
            animationDuration: 1500,
          });
        }

        isInitialFitDone.current = true;
      }, Platform.OS === 'ios' ? 100 : 250);
    }

  }, [isMapReady, location, driverLocation, markers, isUserInteracting, mapTopPadding, mapBottomPadding, cameraRef]);
};

export default useMapAutoFitter;