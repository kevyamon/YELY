// src/hooks/useDriverMapFeatures.js
// HOOK METIER - Gestion dynamique des marqueurs et de l'UI de la carte Chauffeur
// CSCSM Level: Bank Grade

import { useMemo } from 'react';
import THEME from '../theme/theme';

const useDriverMapFeatures = (currentRide, isRideActive, dynamicHeaderHeight = 140, dynamicFooterHeight = 280) => {
  const mapMarkers = useMemo(() => {
    if (!isRideActive || !currentRide) return [];

    const isOngoing = currentRide.status === 'in_progress';

    const originLat = currentRide.origin?.coordinates?.[1] ?? currentRide.origin?.latitude;
    const originLng = currentRide.origin?.coordinates?.[0] ?? currentRide.origin?.longitude;
    const destLat = currentRide.destination?.coordinates?.[1] ?? currentRide.destination?.latitude;
    const destLng = currentRide.destination?.coordinates?.[0] ?? currentRide.destination?.longitude;

    if (isOngoing) {
      const markers = [];

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

      return markers;
    }

    if (originLat && originLng) {
      return [{
        id: 'pickup',
        type: 'pickup',
        latitude: Number(originLat),
        longitude: Number(originLng),
        title: currentRide.origin?.address || 'Client',
        iconColor: THEME.COLORS.info,
      }];
    }

    return [];
  }, [isRideActive, currentRide]);

  // On utilise les hauteurs dynamiques + une marge de respiration de 20px
  const mapTopPadding = dynamicHeaderHeight > 0 ? dynamicHeaderHeight + 20 : (isRideActive ? 160 : 140);
  const mapBottomPadding = dynamicFooterHeight > 0 ? dynamicFooterHeight + 20 : (isRideActive ? 380 : 280);

  return {
    mapMarkers,
    mapTopPadding,
    mapBottomPadding,
  };
};

export default useDriverMapFeatures;