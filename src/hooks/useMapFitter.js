// src/hooks/useMapFitter.js
// HOOK CARTE NATIF - Caméra Intelligente & Cadrage Synchronisé Point A - Point B
// CSCSM Level: Bank Grade (Strictement modulaire < 270 lignes, Sans Emojis)

import { useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import { MAFERE_CENTER } from '../utils/mafereZone';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_BOUNDS_SPAN = 0.0035;

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const hasMovedSignificantly = (loc1, loc2, threshold = 15) => {
  if (!loc1 && !loc2) return false;
  if (!loc1 || !loc2) return true;
  return getDistance(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude) > threshold;
};

const markersMovedSignificantly = (markers1, markers2, threshold = 15) => {
  if (!markers1 || !markers2) return true;
  if (markers1.length !== markers2.length) return true;
  for (let i = 0; i < markers1.length; i++) {
    const m1 = markers1[i];
    const m2 = markers2[i];
    if (!m1 || !m2 || m1.type !== m2.type) return true;
    if (getDistance(m1.latitude, m1.longitude, m2.latitude, m2.longitude) > threshold) return true;
  }
  return false;
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
  const lastFittedMarkersRef = useRef([]);
  const lastRideStatusRef = useRef(null);
  const lastFittedDestKeyRef = useRef(null);
  const lastFittedRouteKeyRef = useRef(null);

  useEffect(() => {
    if (!isMapReady || !cameraRef.current || isUserInteracting) return;

    const hasDriver = driverLocation?.latitude && driverLocation?.longitude;
    const originMarker = hasDriver ? driverLocation : location;
    const isOngoingRide = rideStatus === 'in_progress' || rideStatus === 'ongoing';

    let targetMarker = null;
    if (isOngoingRide) {
      targetMarker = markers.find((m) => m.type === 'destination');
    } else if (hasDriver) {
      targetMarker = markers.find((m) => m.type === 'pickup');
    } else {
      targetMarker = markers.find((m) => m.type === 'destination' || m.type === 'pickup');
    }

    const destMarker = markers.find((m) => m.type === 'destination');
    const isDestMode = !isOngoingRide && !hasDriver && !!destMarker;

    // Réinitialisation propre si la destination a été retirée ou annulée
    if (!destMarker && !hasDriver && !isOngoingRide) {
      lastFittedDestKeyRef.current = null;
      lastFittedRouteKeyRef.current = null;
      isCameraBusyRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    const currentDestKey = destMarker ? `${destMarker.latitude?.toFixed(5)},${destMarker.longitude?.toFixed(5)}` : null;
    const hasRouteGeometry = Array.isArray(routePoints) && routePoints.length >= 2;
    const routeFingerprint = hasRouteGeometry
      ? `${routePoints.length}_${Number(routePoints[0]?.latitude).toFixed(4)}_${Number(routePoints[routePoints.length - 1]?.latitude).toFixed(4)}`
      : 'none';

    // Règle d'or : Une fois la destination ET le tracé complet cadrés, la caméra reste totalement immobile
    if (isDestMode && isInitialFitDone.current && lastFittedDestKeyRef.current === currentDestKey && lastFittedRouteKeyRef.current === routeFingerprint) {
      return;
    }

    const isInitial = !isInitialFitDone.current;
    const locChanged = hasMovedSignificantly(location, lastFittedLocationRef.current, 15);
    const driverLocChanged = hasMovedSignificantly(driverLocation, lastFittedDriverLocationRef.current, 15);
    const markersChanged = markersMovedSignificantly(markers, lastFittedMarkersRef.current, 10);
    const statusChanged = lastRideStatusRef.current !== rideStatus;
    const routeChanged = lastFittedRouteKeyRef.current !== routeFingerprint;

    if (!isInitial && !locChanged && !driverLocChanged && !markersChanged && !statusChanged && !routeChanged && (lastFittedDestKeyRef.current === currentDestKey)) {
      return;
    }

    let coordsToFit = [];
    if (hasRouteGeometry && !!targetMarker) {
      // Ingestion complète de tous les virages et points de l'itinéraire OSRM
      coordsToFit = routePoints
        .map((p) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }))
        .filter((p) => !isNaN(p.latitude) && !isNaN(p.longitude));
    } else if (targetMarker?.latitude && targetMarker?.longitude && originMarker?.latitude && originMarker?.longitude) {
      coordsToFit = [
        { latitude: Number(originMarker.latitude), longitude: Number(originMarker.longitude) },
        { latitude: Number(targetMarker.latitude), longitude: Number(targetMarker.longitude) },
      ];
    } else if (originMarker?.latitude && originMarker?.longitude) {
      coordsToFit.push({ latitude: Number(originMarker.latitude), longitude: Number(originMarker.longitude) });
    }

    if (coordsToFit.length === 0) {
      if (!isInitialFitDone.current) {
        cameraRef.current?.setCamera({
          centerCoordinate: [MAFERE_CENTER.longitude, MAFERE_CENTER.latitude],
          zoomLevel: 14,
          animationDuration: 600,
        });
        isInitialFitDone.current = true;
      }
      lastFittedDestKeyRef.current = null;
      lastFittedRouteKeyRef.current = null;
      return;
    }

    // Évite d'interrompre une transition de caméra majeure en cours
    if (isCameraBusyRef.current && !markersChanged && !statusChanged && !routeChanged && !isInitial) {
      return;
    }

    const isMultiPoint = coordsToFit.length >= 2;
    const delay = isMultiPoint || isInitial ? (Platform.OS === 'ios' ? 30 : 60) : 150;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!cameraRef.current || isUserInteracting) return;

      const dynamicTop = isDestMode ? Math.max(Number(mapTopPadding) || 120, 130) : Math.max(Number(mapTopPadding) || 120, 90) + 16;
      const dynamicBottom = isDestMode ? Math.max(Number(mapBottomPadding) || 240, 370) : Math.max(Number(mapBottomPadding) || 240, 220) + 24;
      const animDuration = isMultiPoint ? 850 : 700;

      if (!isMultiPoint) {
        if (!isInitialFitDone.current) {
          cameraRef.current.setCamera({
            centerCoordinate: [coordsToFit[0].longitude, coordsToFit[0].latitude],
            zoomLevel: 15,
            padding: { paddingTop: dynamicTop, paddingBottom: dynamicBottom, paddingLeft: 0, paddingRight: 0 },
            animationDuration: animDuration,
          });
          isInitialFitDone.current = true;
        }
        lastFittedDestKeyRef.current = null;
        lastFittedRouteKeyRef.current = null;
        lastFittedLocationRef.current = location ? { latitude: location.latitude, longitude: location.longitude } : null;
        lastFittedDriverLocationRef.current = driverLocation ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude } : null;
        lastFittedMarkersRef.current = markers.map((m) => ({ type: m.type, latitude: m.latitude, longitude: m.longitude }));
        return;
      }

      const lats = coordsToFit.map((c) => c.latitude).filter((n) => !isNaN(n));
      const lngs = coordsToFit.map((c) => c.longitude).filter((n) => !isNaN(n));
      let minLng = Math.min(...lngs);
      let maxLng = Math.max(...lngs);
      let minLat = Math.min(...lats);
      let maxLat = Math.max(...lats);

      // Marge de respiration géographique de 14% autour de l'itinéraire complet pour une visibilité sans coupure
      const latSpan = maxLat - minLat;
      const lngSpan = maxLng - minLng;
      const latMargin = Math.max(latSpan * 0.14, 0.002);
      const lngMargin = Math.max(lngSpan * 0.14, 0.002);
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
      clearTimeout(busyTimerRef.current);
      busyTimerRef.current = setTimeout(() => {
        isCameraBusyRef.current = false;
      }, animDuration);

      isInitialFitDone.current = true;
      lastFittedDestKeyRef.current = currentDestKey;
      lastFittedRouteKeyRef.current = routeFingerprint;
      lastFittedLocationRef.current = location ? { latitude: location.latitude, longitude: location.longitude } : null;
      lastFittedDriverLocationRef.current = driverLocation ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude } : null;
      lastFittedMarkersRef.current = markers.map((m) => ({ type: m.type, latitude: m.latitude, longitude: m.longitude }));
      lastRideStatusRef.current = rideStatus;
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, routePoints, isUserInteracting, cameraRef, rideStatus]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(busyTimerRef.current);
    };
  }, []);
};

export default useMapFitter;