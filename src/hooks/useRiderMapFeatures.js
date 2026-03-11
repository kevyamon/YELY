// src/hooks/useRiderMapFeatures.js
// HOOK METIER - Gestion dynamique de l'affichage cartographique (Passager)
// CSCSM Level: Bank Grade

import { useMemo } from 'react';
import THEME from '../theme/theme';

const useRiderMapFeatures = ({ destination, isRideActive, currentRide, location }) => {

  const rideStatus = currentRide?.status;

  const originLat = currentRide?.origin?.coordinates?.[1] ?? currentRide?.origin?.latitude;
  const originLng = currentRide?.origin?.coordinates?.[0] ?? currentRide?.origin?.longitude;
  const destLat = currentRide?.destination?.coordinates?.[1] ?? currentRide?.destination?.latitude;
  const destLng = currentRide?.destination?.coordinates?.[0] ?? currentRide?.destination?.longitude;

  const driverLocationObj = currentRide?.driverLocation;
  const driverLat = driverLocationObj?.coordinates?.[1] ?? driverLocationObj?.latitude;
  const driverLng = driverLocationObj?.coordinates?.[0] ?? driverLocationObj?.longitude;
  const driverHeading = driverLocationObj?.heading ?? 0;

  const driverLatLng = useMemo(() => {
    if (!driverLat || !driverLng) return null;
    return {
      latitude: Number(driverLat),
      longitude: Number(driverLng),
      heading: Number(driverHeading),
    };
  }, [driverLat, driverLng, driverHeading]);

  const mapMarkers = useMemo(() => {
    if (isRideActive && rideStatus) {
      const isOngoing = rideStatus === 'in_progress';

      if (isOngoing) {
        const markers = [];

        if (originLat && originLng) {
          markers.push({
            id: 'pickup_origin',
            type: 'pickup_origin',
            latitude: Number(originLat),
            longitude: Number(originLng),
            title: currentRide?.origin?.address || 'Point de rencontre',
          });
        }

        // SUPPRESSION DU DRAPEAU CHEZ LE PASSAGER EN COURS DE ROUTE
        // Le passager n'a pas besoin du drapeau de destination car son écran indique déjà où il va.
        /* if (destLat && destLng) {
          markers.push({
            id: 'destination',
            type: 'destination', // C'est ce type qui déclenche AnimatedDestinationMarker
            ...
          });
        }
        */

        return markers;
      }

      // Si le chauffeur est en route vers nous (accepted, arrived)
      if (!originLat || !originLng) return [];

      return [{
        id: 'pickup',
        type: 'pickup',
        latitude: Number(originLat),
        longitude: Number(originLng),
        title: currentRide?.origin?.address || 'Point de rencontre',
        iconColor: THEME.COLORS.info,
      }];
    }

    if (!destination) return [];

    // Marqueur de destination AVANT la commande (utile pour visualiser où on veut aller)
    return [{
      id: 'destination',
      latitude: Number(destination.latitude),
      longitude: Number(destination.longitude),
      title: destination.address,
      iconColor: THEME.COLORS.danger,
      type: 'destination',
    }];
  }, [destination, isRideActive, rideStatus, originLat, originLng, destLat, destLng, currentRide?.origin?.address, currentRide?.destination?.address]);

  // GESTION SPATIALE DYNAMIQUE
  const mapTopPadding = 140; 
  const mapBottomPadding = isRideActive ? 320 : (destination ? 380 : 240);

  const mapTraceOrigin = location;

  return {
    mapMarkers,
    mapTopPadding,
    mapBottomPadding,
    driverLatLng,
    mapTraceOrigin,
  };
};

export default useRiderMapFeatures;