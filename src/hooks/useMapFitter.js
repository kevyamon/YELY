// src/hooks/useMapFitter.js
// HOOK CARTE NATIF - Caméra Intelligente & Cadrage Synchronisé Point A - Point B
// CSCSM Level: Bank Grade (Invariant du Trio Sacré, Anti-saccade & Zéro conflit)

import { useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import { MAFERE_CENTER } from '../utils/mafereZone';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_BOUNDS_SPAN = 0.0040;

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const hasMovedSignificantly = (loc1, loc2, threshold = 20) => {
  if (!loc1 && !loc2) return false;
  if (!loc1 || !loc2) return true;
  return getDistance(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude) > threshold;
};

const useMapFitter = ({
  isMapReady,
  cameraRef,
  location,
  driverLocation,
  markers = [],
  routePoints = [],
  mapTopPadding = 140,
  mapBottomPadding = 240,
  isUserInteracting = false,
  rideStatus = null,
}) => {
  const isInitialFitDone = useRef(false);
  const isCameraBusyRef = useRef(false);
  const busyTimerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastFittedLocationRef = useRef(null);
  const lastFittedDriverLocationRef = useRef(null);
  const lastFittedTrioKeyRef = useRef(null);
  const wasInDestModeRef = useRef(false);

  useEffect(() => {
    if (!isMapReady || !cameraRef.current || isUserInteracting) return;

    const hasDriver = !!(driverLocation?.latitude && driverLocation?.longitude);
    const originMarker = hasDriver ? driverLocation : location;
    const isOngoingRide = rideStatus === 'in_progress' || rideStatus === 'ongoing';

    const destMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');
    const isDestMode = !isOngoingRide && !hasDriver && !!destMarker;

    // Transition de sortie : Annulation explicite de la destination -> Retour au repos passager
    if (!destMarker && !hasDriver && !isOngoingRide && wasInDestModeRef.current) {
      wasInDestModeRef.current = false;
      lastFittedTrioKeyRef.current = null;
      isCameraBusyRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (busyTimerRef.current) clearTimeout(busyTimerRef.current);

      if (originMarker?.latitude && originMarker?.longitude) {
        cameraRef.current.setCamera({
          centerCoordinate: [Number(originMarker.longitude), Number(originMarker.latitude)],
          zoomLevel: 15,
          padding: { paddingTop: mapTopPadding, paddingBottom: mapBottomPadding, paddingLeft: 0, paddingRight: 0 },
          animationDuration: 550,
        });
        lastFittedLocationRef.current = location ? { latitude: location.latitude, longitude: location.longitude } : null;
      }
      return;
    }

    if (isDestMode) {
      wasInDestModeRef.current = true;
    }

    // Calcul de l'empreinte unique du Trio [Départ + Tracé + Arrivée]
    const hasRouteGeometry = Array.isArray(routePoints) && routePoints.length >= 2;
    const destKey = destMarker ? `${Number(destMarker.latitude).toFixed(5)},${Number(destMarker.longitude).toFixed(5)}` : 'none';
    const routeKey = hasRouteGeometry
      ? `${routePoints.length}_${Number(routePoints[0]?.latitude).toFixed(4)}_${Number(routePoints[routePoints.length - 1]?.latitude).toFixed(4)}`
      : 'direct';
    const currentTrioKey = isDestMode ? `TRIO_${destKey}_${routeKey}` : null;

    // INVARIANT DU TRIO SACRÉ : Si le Trio actuel est déjà parfaitement cadré, la caméra reste figée
    if (isDestMode && isInitialFitDone.current && lastFittedTrioKeyRef.current === currentTrioKey) {
      return;
    }

    // Détection des mouvements significatifs hors mode destination
    const locChanged = hasMovedSignificantly(location, lastFittedLocationRef.current, 25);
    const driverLocChanged = hasMovedSignificantly(driverLocation, lastFittedDriverLocationRef.current, 15);

    if (!isDestMode && isInitialFitDone.current && !locChanged && !driverLocChanged) {
      return;
    }

    // Construction stricte de la liste des coordonnées à cadrer
    let coordsToFit = [];

    if (isDestMode) {
      // Priorité absolue au Trio : Départ + Tracé complet + Destination
      if (originMarker?.latitude && originMarker?.longitude) {
        coordsToFit.push({ latitude: Number(originMarker.latitude), longitude: Number(originMarker.longitude) });
      }

      if (hasRouteGeometry) {
        routePoints.forEach((p) => {
          const pLat = Number(p.latitude);
          const pLng = Number(p.longitude);
          if (!isNaN(pLat) && !isNaN(pLng)) {
            coordsToFit.push({ latitude: pLat, longitude: pLng });
          }
        });
      }

      if (destMarker?.latitude && destMarker?.longitude) {
        coordsToFit.push({ latitude: Number(destMarker.latitude), longitude: Number(destMarker.longitude) });
      }

      // Protection mathématique : Si moins de 2 points alors qu'on est en mode destination, on attend
      if (coordsToFit.length < 2) return;

    } else if (isOngoingRide && destMarker?.latitude && originMarker?.latitude) {
      coordsToFit = [
        { latitude: Number(originMarker.latitude), longitude: Number(originMarker.longitude) },
        { latitude: Number(destMarker.latitude), longitude: Number(destMarker.longitude) },
      ];
    } else if (hasDriver && pickupMarker?.latitude && originMarker?.latitude) {
      coordsToFit = [
        { latitude: Number(originMarker.latitude), longitude: Number(originMarker.longitude) },
        { latitude: Number(pickupMarker.latitude), longitude: Number(pickupMarker.longitude) },
      ];
    } else if (originMarker?.latitude && originMarker?.longitude) {
      coordsToFit.push({ latitude: Number(originMarker.latitude), longitude: Number(originMarker.longitude) });
    }

    // Gestion du cas initial vide (centrage Maféré)
    if (coordsToFit.length === 0) {
      if (!isInitialFitDone.current) {
        cameraRef.current?.setCamera({
          centerCoordinate: [MAFERE_CENTER.longitude, MAFERE_CENTER.latitude],
          zoomLevel: 14,
          animationDuration: 600,
        });
        isInitialFitDone.current = true;
      }
      return;
    }

    const isMultiPoint = coordsToFit.length >= 2;
    const animDuration = isMultiPoint ? 700 : 500;
    const dynamicTop = isDestMode ? Math.max(Number(mapTopPadding) || 120, 130) : Math.max(Number(mapTopPadding) || 120, 90) + 16;
    const dynamicBottom = isDestMode ? Math.max(Number(mapBottomPadding) || 240, 370) : Math.max(Number(mapBottomPadding) || 240, 220) + 24;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const executeCameraMove = () => {
      if (!cameraRef.current || isUserInteracting) return;

      // INTERDICTION FORMELLE : Jamais de cadrage mono-point si destination active
      if (!isMultiPoint) {
        if (isDestMode) return;
        cameraRef.current.setCamera({
          centerCoordinate: [coordsToFit[0].longitude, coordsToFit[0].latitude],
          zoomLevel: 15,
          padding: { paddingTop: dynamicTop, paddingBottom: dynamicBottom, paddingLeft: 0, paddingRight: 0 },
          animationDuration: animDuration,
        });
        isInitialFitDone.current = true;
        lastFittedLocationRef.current = location ? { latitude: location.latitude, longitude: location.longitude } : null;
        lastFittedDriverLocationRef.current = driverLocation ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude } : null;
        return;
      }

      // Calcul des bornes géographiques (Bounding Box)
      const lats = coordsToFit.map((c) => c.latitude).filter((n) => !isNaN(n));
      const lngs = coordsToFit.map((c) => c.longitude).filter((n) => !isNaN(n));
      let minLng = Math.min(...lngs);
      let maxLng = Math.max(...lngs);
      let minLat = Math.min(...lats);
      let maxLat = Math.max(...lats);

      const latSpan = maxLat - minLat;
      const lngSpan = maxLng - minLng;
      const latMargin = Math.max(latSpan * 0.14, 0.0025);
      const lngMargin = Math.max(lngSpan * 0.14, 0.0025);
      minLng -= lngMargin;
      maxLng += lngMargin;
      minLat -= latMargin;
      maxLat += latMargin;

      if (maxLng - minLng < MIN_BOUNDS_SPAN) {
        const midLng = (minLng + maxLng) / 2;
        minLng = midLng - MIN_BOUNDS_SPAN / 2;
        maxLng = midLng + MIN_BOUNDS_SPAN / 2;
      }
      if (maxLat - minLat < MIN_BOUNDS_SPAN) {
        const midLat = (minLat + maxLat) / 2;
        minLat = midLat - MIN_BOUNDS_SPAN / 2;
        maxLat = midLat + MIN_BOUNDS_SPAN / 2;
      }

      cameraRef.current.setCamera({
        bounds: {
          ne: [maxLng, maxLat],
          sw: [minLng, minLat],
          paddingTop: dynamicTop,
          paddingBottom: dynamicBottom,
          paddingLeft: Math.round(SCREEN_WIDTH * 0.10),
          paddingRight: Math.round(SCREEN_WIDTH * 0.10),
        },
        pitch: 0,
        animationDuration: animDuration,
      });

      isCameraBusyRef.current = true;
      if (busyTimerRef.current) clearTimeout(busyTimerRef.current);
      busyTimerRef.current = setTimeout(() => {
        isCameraBusyRef.current = false;
      }, animDuration + 60);

      isInitialFitDone.current = true;
      if (isDestMode) lastFittedTrioKeyRef.current = currentTrioKey;
      lastFittedLocationRef.current = location ? { latitude: location.latitude, longitude: location.longitude } : null;
      lastFittedDriverLocationRef.current = driverLocation ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude } : null;
    };

    const delay = Platform.OS === 'ios' ? 20 : 30;
    timeoutRef.current = setTimeout(executeCameraMove, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, routePoints, isUserInteracting, cameraRef, rideStatus]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (busyTimerRef.current) clearTimeout(busyTimerRef.current);
    };
  }, []);
};

export default useMapFitter;