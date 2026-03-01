// src/hooks/useRiderMapFeatures.js
// HOOK METIER - Gestion dynamique de l'affichage cartographique (Passager)
// CSCSM Level: Bank Grade

import { useMemo } from 'react';
import THEME from '../theme/theme';

const useRiderMapFeatures = ({ destination, isRideActive, currentRide, location }) => {

  // Extraction robuste de la position du chauffeur depuis le state Redux
  const driverLocationObj = currentRide?.driverLocation;
  const driverLatLng = (driverLocationObj?.latitude || driverLocationObj?.coordinates)
    ? {
        latitude: driverLocationObj?.coordinates?.[1] ?? driverLocationObj?.latitude,
        longitude: driverLocationObj?.coordinates?.[0] ?? driverLocationObj?.longitude,
        heading: driverLocationObj?.heading ?? 0,
      }
    : null;

  const mapMarkers = useMemo(() => {
    if (isRideActive && currentRide) {
      const isOngoing = currentRide.status === 'in_progress';

      const originLat = currentRide.origin?.coordinates?.[1] ?? currentRide.origin?.latitude;
      const originLng = currentRide.origin?.coordinates?.[0] ?? currentRide.origin?.longitude;
      const destLat = currentRide.destination?.coordinates?.[1] ?? currentRide.destination?.latitude;
      const destLng = currentRide.destination?.coordinates?.[0] ?? currentRide.destination?.longitude;

      if (isOngoing) {
        // Phase 2 : course en cours, chauffeur roule vers la destination du client.
        // On pose un marqueur pickup_origin sur le point de rencontre pour que
        // useRouteManager sache qu'on est en phase "destination finale".
        // La destination est la cible du tracé.
        const markers = [];

        if (originLat && originLng) {
          markers.push({
            id: 'pickup_origin',
            type: 'pickup_origin',
            latitude: Number(originLat),
            longitude: Number(originLng),
            title: currentRide.origin?.address || 'Point de rencontre',
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

      // Phase 1 : chauffeur en approche vers le point de rencontre (statuts accepted/arrived).
      // Le marqueur type 'pickup' indique la cible du tracé.
      // useRouteManager utilisera driverLocation comme origine du tracé.
      if (!originLat || !originLng) return [];

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

    // Phase pre-commande : affichage de la destination choisie par le client
    return [{
      id: 'destination',
      latitude: Number(destination.latitude),
      longitude: Number(destination.longitude),
      title: destination.address,
      iconColor: THEME.COLORS.danger,
      type: 'destination',
    }];
  }, [destination, isRideActive, currentRide]);

  const mapBottomPadding = isRideActive ? 280 : (destination ? 320 : 240);

  // La position passee a MapCard comme "location" est toujours la position GPS
  // reelle du passager. C'est la reference fixe pour la carte.
  // La prop "driverLocation" de MapCard est l'icone mobile du chauffeur.
  // En phase active, on centre la vue entre le chauffeur et la cible.
  // En phase post-course (ride terminee, markers vides), la carte revient
  // automatiquement sur la position du passager grace a cette valeur stable.
  const mapTraceOrigin = location;

  return {
    mapMarkers,
    mapBottomPadding,
    driverLatLng,
    mapTraceOrigin,
  };
};

export default useRiderMapFeatures;