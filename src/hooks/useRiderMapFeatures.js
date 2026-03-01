// src/hooks/useRiderMapFeatures.js
// HOOK METIER - Gestion dynamique de l'affichage cartographique (Passager)
// CSCSM Level: Bank Grade

import { useMemo } from 'react';
import THEME from '../theme/theme';

const useRiderMapFeatures = ({ destination, isRideActive, currentRide, location }) => {
  const mapMarkers = useMemo(() => {
    if (isRideActive && currentRide) {
      // CORRECTION : Alignement strict sur le vocabulaire du Backend / Redux
      const isOngoing = currentRide.status === 'in_progress';

      if (isOngoing) {
        const destLat = currentRide.destination?.coordinates?.[1] || currentRide.destination?.latitude;
        const destLng = currentRide.destination?.coordinates?.[0] || currentRide.destination?.longitude;
        const originLat = currentRide.origin?.coordinates?.[1] || currentRide.origin?.latitude;
        const originLng = currentRide.origin?.coordinates?.[0] || currentRide.origin?.longitude;
        
        const markers = [];
        
        // Cible du routage en cours
        if (destLat && destLng) {
          markers.push({
            id: 'destination',
            type: 'destination',
            latitude: Number(destLat),
            longitude: Number(destLng),
            title: currentRide.destination?.address || 'Destination',
            iconColor: THEME.COLORS.danger,
          });
        }
        
        // Point de depart maintenu visuellement pour le contexte
        if (originLat && originLng) {
          markers.push({
            id: 'pickup_origin',
            type: 'pickup_origin',
            latitude: Number(originLat),
            longitude: Number(originLng),
            title: currentRide.origin?.address || 'Depart',
          });
        }
        
        return markers;
      }

      const originLat = currentRide.origin?.coordinates?.[1] || currentRide.origin?.latitude;
      const originLng = currentRide.origin?.coordinates?.[0] || currentRide.origin?.longitude;
      if (!originLat || !originLng) return [];
      
      // Phase d'approche du chauffeur
      return [{
        id: 'pickup',
        type: 'pickup',
        latitude: Number(originLat),
        longitude: Number(originLng),
        title: currentRide.origin?.address || 'Point de rencontre',
        iconColor: THEME.COLORS.info,
      }];
    }

    if (!destination) return [];
    
    // Phase de selection de la destination avant commande
    return [{
      id: 'destination',
      latitude: Number(destination.latitude),
      longitude: Number(destination.longitude),
      title: destination.address,
      iconColor: THEME.COLORS.danger,
      type: 'destination'
    }];
  }, [destination, isRideActive, currentRide]);

  const mapBottomPadding = isRideActive ? 280 : (destination ? 320 : 240);

  const driverLocationObj = currentRide?.driverLocation;
  const driverLatLng = driverLocationObj
    ? {
        latitude: driverLocationObj?.coordinates?.[1] ?? driverLocationObj?.latitude,
        longitude: driverLocationObj?.coordinates?.[0] ?? driverLocationObj?.longitude,
        heading: driverLocationObj?.heading,
      }
    : null;

  const mapTraceOrigin = (isRideActive && driverLatLng?.latitude) ? driverLatLng : location;

  return {
    mapMarkers,
    mapBottomPadding,
    driverLatLng,
    mapTraceOrigin
  };
};

export default useRiderMapFeatures;