// src/hooks/useRouteManager.js
// GESTIONNAIRE DE TRACÉ D'ITINÉRAIRE - Animation fluide, réactivité instantanée et résilience
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis)

import { useCallback, useEffect, useRef, useState } from 'react';
import MapService from '../services/mapService';
import {
  computeStepSize,
  distanceToRoute,
  distSq,
  FAST_RETRY_DELAY_MS,
  getProjectedPoint,
  haversineMeters,
  ROUTE_DRAW_INTERVAL_MS,
  SILENT_RETRY_DELAY_MS,
  TRIM_THRESHOLD_METERS,
  DEVIATION_THRESHOLD_METERS,
} from '../utils/routeGeometry';

const useRouteManager = (location, driverLocation, markers) => {
  const [visibleRoutePoints, setVisibleRoutePoints] = useState([]);
  const [fullRoutePoints, setFullRoutePoints] = useState([]);

  const drawIntervalRef = useRef(null);
  const isDrawingRouteRef = useRef(false);

  const fullRoutePointsRef = useRef([]);
  const lastRouteOriginRef = useRef(null);
  const lastRouteDestKeyRef = useRef(null);
  const lastPassedIndexRef = useRef(0);
  
  const lastRouteFetchTimeRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    MapService.preloadRoutingEngine();
  }, []);

  const stopDrawAnimation = useCallback(() => {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
    isDrawingRouteRef.current = false;
  }, []);

  const animateRouteDraw = useCallback(
    (fullPoints) => {
      stopDrawAnimation();
      setVisibleRoutePoints([]);

      if (!fullPoints || fullPoints.length === 0) return;

      isDrawingRouteRef.current = true;
      let revealedCount = 0;
      const stepSize = computeStepSize(fullPoints.length);

      drawIntervalRef.current = setInterval(() => {
        revealedCount = Math.min(revealedCount + stepSize, fullPoints.length);
        setVisibleRoutePoints(fullPoints.slice(0, revealedCount));

        if (revealedCount >= fullPoints.length) {
          stopDrawAnimation();
        }
      }, ROUTE_DRAW_INTERVAL_MS);
    },
    [stopDrawAnimation]
  );

  const fetchAndStoreRoute = useCallback(
    async (pointA, pointB, destKey, isFastRetry = false) => {
      if (!pointA || !pointB) {
        stopDrawAnimation();
        setVisibleRoutePoints([]);
        setFullRoutePoints([]);
        fullRoutePointsRef.current = [];
        lastRouteOriginRef.current = null;
        lastRouteDestKeyRef.current = null;
        lastPassedIndexRef.current = 0;
        return;
      }

      if (isFetchingRef.current && !isFastRetry) return;
      isFetchingRef.current = true;

      lastRouteDestKeyRef.current = destKey;
      lastRouteOriginRef.current = { latitude: pointA.latitude, longitude: pointA.longitude };
      lastRouteFetchTimeRef.current = Date.now();

      try {
        const routePoints = await MapService.getRouteCoordinates(pointA, pointB);
        isFetchingRef.current = false;
        
        if (lastRouteDestKeyRef.current !== destKey) return;

        const isFallbackStraightLine = routePoints && routePoints.length === 2;
        const hasExistingDetailedRoute = fullRoutePointsRef.current && fullRoutePointsRef.current.length > 2;

        if (isFallbackStraightLine && !hasExistingDetailedRoute && !isFastRetry) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (lastRouteDestKeyRef.current === destKey) {
              fetchAndStoreRoute(pointA, pointB, destKey, true);
            }
          }, FAST_RETRY_DELAY_MS);
          return;
        }

        if (!routePoints || (isFallbackStraightLine && hasExistingDetailedRoute)) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (lastRouteDestKeyRef.current === destKey) {
              lastRouteFetchTimeRef.current = 0; 
            }
          }, SILENT_RETRY_DELAY_MS);
          return;
        }

        clearTimeout(retryTimeoutRef.current);
        fullRoutePointsRef.current = routePoints;
        setFullRoutePoints(routePoints);
        lastPassedIndexRef.current = 0;
        animateRouteDraw(routePoints);
      } catch (_) {
        isFetchingRef.current = false;
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          if (lastRouteDestKeyRef.current === destKey) {
            lastRouteFetchTimeRef.current = 0;
          }
        }, FAST_RETRY_DELAY_MS);
      }
    },
    [animateRouteDraw, stopDrawAnimation]
  );

  const trimRouteFromCurrentPosition = useCallback((currentLat, currentLng) => {
    const full = fullRoutePointsRef.current;
    if (!full || full.length < 2) return;

    const P = { latitude: currentLat, longitude: currentLng };
    const startIndex = lastPassedIndexRef.current || 0;
    let closestIdx = startIndex;
    let minDist = Infinity;

    const scanLimit = Math.min(full.length, startIndex + 100);

    for (let i = startIndex; i < scanLimit; i++) {
      const d = haversineMeters(currentLat, currentLng, full[i].latitude, full[i].longitude);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }

    let bestProj = null;
    let bestDist = Infinity;
    let sliceIndex = closestIdx + 1;

    if (closestIdx > 0) {
      const proj1 = getProjectedPoint(full[closestIdx - 1], full[closestIdx], P);
      const d1 = distSq(P, proj1);
      if (d1 < bestDist) {
        bestDist = d1;
        bestProj = proj1;
        sliceIndex = closestIdx;
      }
    }

    if (closestIdx < full.length - 1) {
      const proj2 = getProjectedPoint(full[closestIdx], full[closestIdx + 1], P);
      const d2 = distSq(P, proj2);
      if (d2 < bestDist) {
        bestDist = d2;
        bestProj = proj2;
        sliceIndex = closestIdx + 1;
      }
    }

    if (!bestProj) return;

    lastPassedIndexRef.current = Math.max(0, sliceIndex - 1);

    const remaining = full.slice(sliceIndex);
    remaining.unshift({ latitude: bestProj.latitude, longitude: bestProj.longitude });

    if (remaining.length > 1) {
      setVisibleRoutePoints(remaining);
    }
  }, []);

  useEffect(() => {
    if (!markers || !Array.isArray(markers)) return;

    const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
    const destinationMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');

    const targetMarker = pickupMarker || destinationMarker;
    const activeTarget = pickupOriginMarker ? destinationMarker : targetMarker;

    if (!activeTarget || !location) {
      stopDrawAnimation();
      setVisibleRoutePoints([]);
      setFullRoutePoints([]);
      fullRoutePointsRef.current = [];
      lastRouteOriginRef.current = null;
      lastRouteDestKeyRef.current = null;
      lastPassedIndexRef.current = 0;
      return;
    }

    const hasDriverPosition = driverLocation?.latitude != null && driverLocation?.longitude != null;
    const isManualOriginActive = !!pickupOriginMarker && !hasDriverPosition;

    const routeOriginLat = isManualOriginActive 
      ? pickupOriginMarker.latitude 
      : (hasDriverPosition ? driverLocation.latitude : location.latitude);
      
    const routeOriginLng = isManualOriginActive 
      ? pickupOriginMarker.longitude 
      : (hasDriverPosition ? driverLocation.longitude : location.longitude);

    const distToTarget = haversineMeters(
      routeOriginLat,
      routeOriginLng,
      activeTarget.latitude,
      activeTarget.longitude
    );

    if (distToTarget <= 25) {
      stopDrawAnimation();
      setVisibleRoutePoints([]);
      setFullRoutePoints([]);
      fullRoutePointsRef.current = [];
      return;
    }

    const phaseIdentifier = pickupOriginMarker ? 'PHASE2_DROP' : 'PHASE1_PICKUP';
    const destKey = `TARGET_${phaseIdentifier}_${activeTarget.latitude.toFixed(5)},${activeTarget.longitude.toFixed(5)}`;

    if (destKey !== lastRouteDestKeyRef.current) {
      stopDrawAnimation();
      lastPassedIndexRef.current = 0;

      fetchAndStoreRoute(
        { latitude: routeOriginLat, longitude: routeOriginLng },
        { latitude: activeTarget.latitude, longitude: activeTarget.longitude },
        destKey
      );
      return;
    }

    const full = fullRoutePointsRef.current;
    if (!full || full.length === 0) {
      const now = Date.now();
      if (now - lastRouteFetchTimeRef.current > FAST_RETRY_DELAY_MS && !isFetchingRef.current) {
        fetchAndStoreRoute(
          { latitude: routeOriginLat, longitude: routeOriginLng },
          { latitude: activeTarget.latitude, longitude: activeTarget.longitude },
          destKey
        );
      }
      return;
    }

    const deviationDist = distanceToRoute(routeOriginLat, routeOriginLng, full);
    if (deviationDist > DEVIATION_THRESHOLD_METERS) {
      const now = Date.now();
      if (!isDrawingRouteRef.current && (now - lastRouteFetchTimeRef.current > 15000)) {
        fetchAndStoreRoute(
          { latitude: routeOriginLat, longitude: routeOriginLng },
          { latitude: activeTarget.latitude, longitude: activeTarget.longitude },
          destKey
        );
      }
      return;
    }

    const lastOrigin = lastRouteOriginRef.current;
    const movedDist = lastOrigin
      ? haversineMeters(
          routeOriginLat,
          routeOriginLng,
          lastOrigin.latitude,
          lastOrigin.longitude
        )
      : TRIM_THRESHOLD_METERS + 1;

    if (movedDist >= TRIM_THRESHOLD_METERS && !isManualOriginActive) {
      if (!isDrawingRouteRef.current) {
        lastRouteOriginRef.current = { latitude: routeOriginLat, longitude: routeOriginLng };
        trimRouteFromCurrentPosition(routeOriginLat, routeOriginLng);
      }
    }
  }, [
    location,
    driverLocation,
    markers,
    fetchAndStoreRoute,
    trimRouteFromCurrentPosition,
    stopDrawAnimation,
  ]);

  useEffect(() => {
    return () => {
      stopDrawAnimation();
      clearTimeout(retryTimeoutRef.current);
    };
  }, [stopDrawAnimation]);

  return { visibleRoutePoints, fullRoutePoints };
};

export default useRouteManager;