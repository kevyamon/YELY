// src/hooks/useRouteManager.js
// HOOK METIER - Routage dynamique, Animation et Trimming agnostique
// CSCSM Level: Bank Grade

import { useCallback, useEffect, useRef, useState } from 'react';
import MapService from '../services/mapService';

const ROUTE_DRAW_DURATION_MS = 900;
const ROUTE_DRAW_INTERVAL_MS = 16;
const REROUTE_THRESHOLD_METERS = 25;
const DEVIATION_THRESHOLD_METERS = 60;

const computeStepSize = (totalPoints) => {
  const totalFrames = ROUTE_DRAW_DURATION_MS / ROUTE_DRAW_INTERVAL_MS;
  return Math.max(1, Math.ceil(totalPoints / totalFrames));
};

const haversineMeters = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const findClosestPointIndex = (routePoints, currentLat, currentLng) => {
  if (!routePoints || routePoints.length === 0) return 0;
  let minDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < routePoints.length; i++) {
    const d = haversineMeters(
      currentLat,
      currentLng,
      routePoints[i].latitude,
      routePoints[i].longitude
    );
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }
  return closestIdx;
};

const distanceToRoute = (lat, lng, routePoints) => {
  if (!routePoints || routePoints.length < 2) return Infinity;
  let minDist = Infinity;
  for (let i = 0; i < routePoints.length; i++) {
    const d = haversineMeters(
      lat,
      lng,
      routePoints[i].latitude,
      routePoints[i].longitude
    );
    if (d < minDist) minDist = d;
  }
  return minDist;
};

const useRouteManager = (location, driverLocation, markers) => {
  const [visibleRoutePoints, setVisibleRoutePoints] = useState([]);

  const drawIntervalRef = useRef(null);
  const isDrawingRouteRef = useRef(false);

  const fullRoutePointsRef = useRef([]);
  const lastRouteOriginRef = useRef(null);
  const lastRouteDestKeyRef = useRef(null);

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
    async (pointA, pointB) => {
      if (!pointA || !pointB) {
        stopDrawAnimation();
        setVisibleRoutePoints([]);
        fullRoutePointsRef.current = [];
        lastRouteOriginRef.current = null;
        lastRouteDestKeyRef.current = null;
        return;
      }

      const destKey = `${pointB.latitude.toFixed(5)},${pointB.longitude.toFixed(5)}`;
      lastRouteDestKeyRef.current = destKey;
      lastRouteOriginRef.current = { latitude: pointA.latitude, longitude: pointA.longitude };

      const routePoints = await MapService.getRouteCoordinates(pointA, pointB);

      if (lastRouteDestKeyRef.current !== destKey) {
        return;
      }

      fullRoutePointsRef.current = routePoints || [];
      animateRouteDraw(routePoints);
    },
    [animateRouteDraw, stopDrawAnimation]
  );

  const trimRouteFromCurrentPosition = useCallback((currentLat, currentLng) => {
    const full = fullRoutePointsRef.current;
    if (!full || full.length < 2) return;

    const closestIdx = findClosestPointIndex(full, currentLat, currentLng);
    const remaining = full.slice(closestIdx);

    // Le trace suit strictement la route geometrique pour eviter toute deformation
    if (remaining.length > 1) {
      setVisibleRoutePoints(remaining);
    }
  }, []);

  useEffect(() => {
    const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
    const destinationMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');

    const targetMarker = pickupMarker || destinationMarker;
    const activeTarget = pickupOriginMarker ? destinationMarker : targetMarker;

    if (!activeTarget || !location) {
      stopDrawAnimation();
      setVisibleRoutePoints([]);
      fullRoutePointsRef.current = [];
      lastRouteOriginRef.current = null;
      lastRouteDestKeyRef.current = null;
      return;
    }

    const routeOriginLat = driverLocation?.latitude || location.latitude;
    const routeOriginLng = driverLocation?.longitude || location.longitude;

    const destKey = `${activeTarget.latitude.toFixed(5)},${activeTarget.longitude.toFixed(5)}`;

    if (destKey !== lastRouteDestKeyRef.current) {
      fetchAndStoreRoute(
        { latitude: routeOriginLat, longitude: routeOriginLng },
        { latitude: activeTarget.latitude, longitude: activeTarget.longitude }
      );
      return;
    }

    const full = fullRoutePointsRef.current;

    const deviationDist = distanceToRoute(routeOriginLat, routeOriginLng, full);
    if (deviationDist > DEVIATION_THRESHOLD_METERS) {
      if (!isDrawingRouteRef.current) {
        fetchAndStoreRoute(
          { latitude: routeOriginLat, longitude: routeOriginLng },
          { latitude: activeTarget.latitude, longitude: activeTarget.longitude }
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
      : REROUTE_THRESHOLD_METERS + 1;

    if (movedDist >= REROUTE_THRESHOLD_METERS) {
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
    return () => stopDrawAnimation();
  }, [stopDrawAnimation]);

  return { visibleRoutePoints };
};

export default useRouteManager;