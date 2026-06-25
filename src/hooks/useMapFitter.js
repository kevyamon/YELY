// src/hooks/useMapFitter.js
// HOOK CARTE NATIF - Camera Intelligente Hyper-Réactive
// CSCSM Level: Bank Grade

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
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

const hasMovedSignificantly = (loc1, loc2, threshold = 15) => {
  if (!loc1 && !loc2) return false;
  if (!loc1 || !loc2) return true;
  const dist = getDistance(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude);
  return dist > threshold;
};

const markersMovedSignificantly = (markers1, markers2, threshold = 15) => {
  if (!markers1 || !markers2) return true;
  if (markers1.length !== markers2.length) return true;
  for (let i = 0; i < markers1.length; i++) {
    const m1 = markers1[i];
    const m2 = markers2[i];
    if (!m1 || !m2) return true;
    if (m1.type !== m2.type) return true;
    if (getDistance(m1.latitude, m1.longitude, m2.latitude, m2.longitude) > threshold) {
      return true;
    }
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
    if (!isMapReady || !cameraRef.current) return;
    if (isUserInteracting) return;

    const isInitial = !isInitialFitDone.current;
    
    // Contrainte de mouvement pour éviter le jittering (micro-mouvements/bruits GPS)
    const locChanged = hasMovedSignificantly(location, lastFittedLocationRef.current, 15);
    const driverLocChanged = hasMovedSignificantly(driverLocation, lastFittedDriverLocationRef.current, 15);
    const markersChanged = markersMovedSignificantly(markers, lastFittedMarkersRef.current, 15);
    const statusChanged = lastRideStatusRef.current !== rideStatus;

    if (!isInitial && !locChanged && !driverLocChanged && !markersChanged && !statusChanged) {
      return;
    }

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
      if (!isOngoingRide && !hasDriver) {
         markers.forEach(m => {
          if (m.latitude && m.longitude) coordsToFit.push({ latitude: m.latitude, longitude: m.longitude });
        });
      }
    }

    if (coordsToFit.length === 0) {
      if (!isInitialFitDone.current) {
        cameraRef.current?.setCamera({
          centerCoordinate: [MAFERE_CENTER.longitude, MAFERE_CENTER.latitude],
          zoomLevel: 14,
          animationDuration: 800
        });
        isInitialFitDone.current = true;
        lastFittedLocationRef.current = location ? { latitude: location.latitude, longitude: location.longitude } : null;
        lastFittedDriverLocationRef.current = driverLocation ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude } : null;
        lastFittedMarkersRef.current = markers.map(m => ({ type: m.type, latitude: m.latitude, longitude: m.longitude }));
        lastRideStatusRef.current = rideStatus;
      }
      return;
    }

    const now = Date.now();
    const isTrackingActive = coordsToFit.length >= 2;
    
    // REDUCTION MASSIVE DU DEBOUNCE: De 4000ms à 1500ms pour réagir aux micro-coupures réseau
    const debounceTime = isInitialFitDone.current ? 1500 : 300;

    if (now - lastUpdateRef.current > debounceTime) {
      lastUpdateRef.current = now;

      const delay = Platform.OS === 'ios' ? 50 : 150; // Lancement plus rapide de l'animation
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (!cameraRef.current || isUserInteracting) return;

        const dynamicTop = mapTopPadding + 40; 
        const dynamicBottom = mapBottomPadding + 40;

        if (coordsToFit.length === 1) {
          cameraRef.current.setCamera({
            centerCoordinate: [coordsToFit[0].longitude, coordsToFit[0].latitude],
            zoomLevel: 15,
            padding: {
              paddingTop: dynamicTop,
              paddingBottom: dynamicBottom,
              paddingLeft: 0,
              paddingRight: 0
            },
            animationDuration: isInitialFitDone.current ? 1200 : 2000,
          });
          isInitialFitDone.current = true;
          lastFittedLocationRef.current = location ? { latitude: location.latitude, longitude: location.longitude } : null;
          lastFittedDriverLocationRef.current = driverLocation ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude } : null;
          lastFittedMarkersRef.current = markers.map(m => ({ type: m.type, latitude: m.latitude, longitude: m.longitude }));
          lastRideStatusRef.current = rideStatus;
          return;
        }

        let shouldActivateSuperpower = false;

        if (isTrackingActive && targetMarker && originMarker) {
          const distance = getDistance(
            originMarker.latitude, originMarker.longitude,
            targetMarker.latitude, targetMarker.longitude
          );

          if (distance < 600 || distance > 800) {
            shouldActivateSuperpower = true;
          }
        }

        const lats = coordsToFit.map(c => c.latitude);
        const lngs = coordsToFit.map(c => c.longitude);
        const sw = [Math.min(...lngs), Math.min(...lats)];
        const ne = [Math.max(...lngs), Math.max(...lats)];

        cameraRef.current.setCamera({
          bounds: {
            ne,
            sw,
            paddingTop: shouldActivateSuperpower ? dynamicTop + 40 : dynamicTop,
            paddingBottom: shouldActivateSuperpower ? dynamicBottom + 40 : dynamicBottom,
            paddingLeft: SCREEN_WIDTH * 0.12,
            paddingRight: SCREEN_WIDTH * 0.12,
          },
          pitch: shouldActivateSuperpower ? 45 : 0,
          animationDuration: 1200, // Lissage de l'animation (1.2s)
        });

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