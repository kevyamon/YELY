// src/hooks/useMapFitter.js
// HOOK CARTE NATIF - Camera Intelligente & Cadrage Synchronisé Point A - Point B
// CSCSM Level: Bank Grade (Strictement modulaire < 270 lignes, Sans Emojis)

import { useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import { MAFERE_CENTER } from '../utils/mafereZone';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  markers,
  mapTopPadding = 140,
  mapBottomPadding = 240,
  isUserInteracting,
  rideStatus
}) => {
  const lastUpdateRef = useRef(0);
  const isInitialFitDone = useRef(false);
  const timeoutRef = useRef(null);
  const lastFittedLocationRef = useRef(null);
  const lastFittedDriverLocationRef = useRef(null);
  const lastFittedMarkersRef = useRef([]);
  const lastRideStatusRef = useRef(null);

  useEffect(() => {
    if (!isMapReady || !cameraRef.current || isUserInteracting) return;

    const isInitial = !isInitialFitDone.current;
    const locChanged = hasMovedSignificantly(location, lastFittedLocationRef.current, 15);
    const driverLocChanged = hasMovedSignificantly(driverLocation, lastFittedDriverLocationRef.current, 15);
    const markersChanged = markersMovedSignificantly(markers, lastFittedMarkersRef.current, 15);
    const statusChanged = lastRideStatusRef.current !== rideStatus;

    if (!isInitial && !locChanged && !driverLocChanged && !markersChanged && !statusChanged) return;

    let coordsToFit = [];
    const hasDriver = driverLocation?.latitude && driverLocation?.longitude;
    const originMarker = hasDriver ? driverLocation : location;
    const isOngoingRide = rideStatus === 'in_progress' || rideStatus === 'ongoing';

    let targetMarker = null;
    if (isOngoingRide) {
      targetMarker = markers.find(m => m.type === 'destination');
    } else if (hasDriver) {
      targetMarker = markers.find(m => m.type === 'pickup');
    } else {
      targetMarker = markers.find(m => m.type === 'destination' || m.type === 'pickup');
    }

    if (targetMarker && originMarker && targetMarker.latitude && targetMarker.longitude) {
      coordsToFit = [
        { latitude: originMarker.latitude, longitude: originMarker.longitude },
        { latitude: targetMarker.latitude, longitude: targetMarker.longitude }
      ];
    } else if (originMarker && originMarker.latitude && originMarker.longitude) {
      coordsToFit.push({ latitude: originMarker.latitude, longitude: originMarker.longitude });
    }

    if (coordsToFit.length === 0) {
      if (!isInitialFitDone.current) {
        cameraRef.current?.setCamera({
          centerCoordinate: [MAFERE_CENTER.longitude, MAFERE_CENTER.latitude],
          zoomLevel: 14,
          animationDuration: 600
        });
        isInitialFitDone.current = true;
      }
      return;
    }

    const now = Date.now();
    const isDestinationActive = !!markers.find(m => m.type === 'destination');
    const debounceTime = isDestinationActive ? 150 : (isInitialFitDone.current ? 1200 : 200);

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;
      const delay = Platform.OS === 'ios' ? 40 : 100;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (!cameraRef.current || isUserInteracting) return;

        const dynamicTop = mapTopPadding + 20;
        const dynamicBottom = mapBottomPadding + 20;

        if (coordsToFit.length === 1) {
          cameraRef.current.setCamera({
            centerCoordinate: [coordsToFit[0].longitude, coordsToFit[0].latitude],
            zoomLevel: 15,
            padding: { paddingTop: dynamicTop, paddingBottom: dynamicBottom, paddingLeft: 0, paddingRight: 0 },
            animationDuration: 800,
          });
        } else {
          const lats = coordsToFit.map(c => c.latitude);
          const lngs = coordsToFit.map(c => c.longitude);
          const sw = [Math.min(...lngs), Math.min(...lats)];
          const ne = [Math.max(...lngs), Math.max(...lats)];

          cameraRef.current.setCamera({
            bounds: {
              ne,
              sw,
              paddingTop: dynamicTop,
              paddingBottom: dynamicBottom,
              paddingLeft: SCREEN_WIDTH * 0.12,
              paddingRight: SCREEN_WIDTH * 0.12,
            },
            pitch: 0,
            animationDuration: 900,
          });
        }

        isInitialFitDone.current = true;
        lastFittedLocationRef.current = location ? { latitude: location.latitude, longitude: location.longitude } : null;
        lastFittedDriverLocationRef.current = driverLocation ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude } : null;
        lastFittedMarkersRef.current = markers.map(m => ({ type: m.type, latitude: m.latitude, longitude: m.longitude }));
        lastRideStatusRef.current = rideStatus;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isMapReady, mapTopPadding, mapBottomPadding, location, driverLocation, markers, isUserInteracting, cameraRef, rideStatus]);
};

export default useMapFitter;