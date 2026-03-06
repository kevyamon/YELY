// src/components/map/useMapAutoFitter.js
// HOOK CARTE NATIF - Contrôleur de Caméra Silencieux (Cadrage Dynamique Actif)
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const useMapAutoFitter = ({
  isMapReady,
  mapRef,
  location,
  driverLocation,
  markers,
  routePointsToFit, // Remplacement de fullRoutePoints par le tracé dynamique
  mapTopPadding,
  mapBottomPadding,
}) => {
  const lastCameraSignatureRef = useRef('');

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    const allCoords = [];
    
    // 1. Détermination de la Source active (Le point mobile actuel)
    // Priorité absolue au chauffeur s'il est affecté, sinon on utilise le client
    const activeSource = (driverLocation?.latitude && driverLocation?.longitude) 
      ? driverLocation 
      : (location?.latitude && location?.longitude) ? location : null;

    // 2. Détermination de la Cible active (L'objectif de la course)
    const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
    const destinationMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');
    const activeTarget = pickupOriginMarker ? destinationMarker : (pickupMarker || destinationMarker);

    // 3. Imposition stricte des bornes (Source + Cible)
    if (activeSource) {
      allCoords.push({ latitude: activeSource.latitude, longitude: activeSource.longitude });
    }
    if (activeTarget) {
      allCoords.push({ latitude: activeTarget.latitude, longitude: activeTarget.longitude });
    }

    // 4. Ajout du tracé RESTANT (pour gérer les courbes qui sortiraient de l'écran)
    if (routePointsToFit && routePointsToFit.length > 0) {
      allCoords.push(...routePointsToFit);
    } else {
      // Fallback : S'il n'y a pas de tracé, on s'assure d'avoir au moins tous les marqueurs
      markers.forEach(m => {
        if (m.latitude && m.longitude) {
          allCoords.push({ latitude: m.latitude, longitude: m.longitude });
        }
      });
    }

    // 5. Signature intelligente par paliers (Le secret du zoom progressif sans clignotement)
    // On divise le tracé restant par 15 pour créer des paliers. Quand un palier est franchi, la caméra se resserre.
    const routeStep = routePointsToFit ? Math.floor(routePointsToFit.length / 15) : 0;
    const sourceKey = activeSource ? `${activeSource.latitude.toFixed(3)}_${activeSource.longitude.toFixed(3)}` : 'NO_SRC';
    const targetKey = activeTarget ? `${activeTarget.latitude.toFixed(4)}_${activeTarget.longitude.toFixed(4)}` : 'NO_TGT';
    
    const currentSignature = `SIG_${targetKey}_${sourceKey}_STEP_${routeStep}`;

    if (lastCameraSignatureRef.current !== currentSignature) {
      lastCameraSignatureRef.current = currentSignature;

      if (allCoords.length > 1) {
        const timer = setTimeout(() => {
          mapRef.current?.fitToCoordinates(allCoords, {
            edgePadding: { 
              top: mapTopPadding + 40, // Marge augmentée pour aérer la vue lors du zoom
              right: 60, 
              bottom: mapBottomPadding + 40, 
              left: 60 
            },
            animated: true
          });
        }, 600);
        return () => clearTimeout(timer);
      } else if (allCoords.length === 1) {
        const timer = setTimeout(() => {
          mapRef.current?.animateToRegion(
            { 
              latitude: allCoords[0].latitude, 
              longitude: allCoords[0].longitude, 
              latitudeDelta: 0.005, // Zoom plus fort car l'entité est seule/très proche
              longitudeDelta: 0.005 
            },
            800
          );
        }, 600);
        return () => clearTimeout(timer);
      } else if (allCoords.length === 0) {
        // Fallback sécurisé en cas de perte de données
        const timer = setTimeout(() => {
            mapRef.current?.animateToRegion(
              { 
                latitude: MAFERE_CENTER.latitude, 
                longitude: MAFERE_CENTER.longitude, 
                latitudeDelta: 0.02, 
                longitudeDelta: 0.02 
              },
              800
            );
          }, 600);
          return () => clearTimeout(timer);
      }
    }
  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, routePointsToFit, mapRef]);
};

export default useMapAutoFitter;