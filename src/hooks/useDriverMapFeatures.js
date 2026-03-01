// src/hooks/useDriverMapFeatures.js
// HOOK METIER - Gestion dynamique des marqueurs et de l'UI de la carte Chauffeur
// CSCSM Level: Bank Grade

import { useMemo } from 'react';
import THEME from '../theme/theme';

const useDriverMapFeatures = (currentRide, isRideActive) => {
  const mapMarkers = useMemo(() => {
    if (!isRideActive || !currentRide) return [];

    const isOngoing = currentRide.status === 'in_progress';

    const originLat = currentRide.origin?.coordinates?.[1] ?? currentRide.origin?.latitude;
    const originLng = currentRide.origin?.coordinates?.[0] ?? currentRide.origin?.longitude;
    const destLat = currentRide.destination?.coordinates?.[1] ?? currentRide.destination?.latitude;
    const destLng = currentRide.destination?.coordinates?.[0] ?? currentRide.destination?.longitude;

    if (isOngoing) {
      // Phase 2 : le chauffeur roule vers la destination du client.
      // On pose un marqueur pickup_origin sur le point de rencontre afin que
      // useRouteManager sache qu'on est en phase "destination finale" et trace
      // la route depuis la position actuelle du chauffeur vers la destination.
      // Sans ce marqueur, le hook ne sait pas distinguer les deux phases et
      // recalcule la route en boucle ou ne la trace pas du tout.
      const markers = [];

      if (originLat && originLng) {
        markers.push({
          id: 'pickup_origin',
          type: 'pickup_origin',
          latitude: Number(originLat),
          longitude: Number(originLng),
          title: currentRide.origin?.address || 'Point de depart',
        });
      }

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

    // Phase 1 : le chauffeur se dirige vers le point de rencontre (statuts accepted/arrived).
    // Marqueur type 'pickup' = cible du tracé. useRouteManager utilisera
    // la position GPS du chauffeur (passee via location/driverLocation) comme origine.
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

  const mapBottomPadding = isRideActive ? 300 : 320;

  return {
    mapMarkers,
    mapBottomPadding,
  };
};

export default useDriverMapFeatures;