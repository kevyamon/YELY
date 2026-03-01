// src/hooks/useRouteManager.js
// GESTIONNAIRE DE TRACÉ DE ROUTE - Tracé animé, suivi en temps réel et recalcul sur déviation
// CSCSM Level: Bank Grade

import { useCallback, useEffect, useRef, useState } from 'react';
import MapService from '../services/mapService';

const ROUTE_DRAW_DURATION_MS = 900;
const ROUTE_DRAW_INTERVAL_MS = 16;
const TRIM_THRESHOLD_METERS = 2;
const DEVIATION_THRESHOLD_METERS = 60;

const computeStepSize = (totalPoints) => {
  const totalFrames = ROUTE_DRAW_DURATION_MS / ROUTE_DRAW_INTERVAL_MS;
  return Math.max(1, Math.ceil(totalPoints / totalFrames));
};

const haversineMeters = (lat1, lng1, lat2, lng2) => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
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

const getProjectedPoint = (A, B, P) => {
  const dx = B.longitude - A.longitude;
  const dy = B.latitude - A.latitude;
  if (dx === 0 && dy === 0) return { latitude: A.latitude, longitude: A.longitude };

  const t = ((P.longitude - A.longitude) * dx + (P.latitude - A.latitude) * dy) / (dx * dx + dy * dy);
  const tClamped = Math.max(0, Math.min(1, t));

  return {
    latitude: A.latitude + tClamped * dy,
    longitude: A.longitude + tClamped * dx,
  };
};

const distSq = (p1, p2) =>
  Math.pow(p1.latitude - p2.latitude, 2) + Math.pow(p1.longitude - p2.longitude, 2);

const useRouteManager = (location, driverLocation, markers) => {
  const [visibleRoutePoints, setVisibleRoutePoints] = useState([]);

  const drawIntervalRef = useRef(null);
  const isDrawingRouteRef = useRef(false);

  const fullRoutePointsRef = useRef([]);
  const lastRouteOriginRef = useRef(null);
  const lastRouteDestKeyRef = useRef(null);
  const lastPassedIndexRef = useRef(0);

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
    async (pointA, pointB, destKey) => {
      if (!pointA || !pointB) {
        stopDrawAnimation();
        setVisibleRoutePoints([]);
        fullRoutePointsRef.current = [];
        lastRouteOriginRef.current = null;
        lastRouteDestKeyRef.current = null;
        lastPassedIndexRef.current = 0;
        return;
      }

      lastRouteDestKeyRef.current = destKey;
      lastRouteOriginRef.current = { latitude: pointA.latitude, longitude: pointA.longitude };

      const routePoints = await MapService.getRouteCoordinates(pointA, pointB);

      // Protection contre les réponses obsolètes si la cible a changé entre-temps
      if (lastRouteDestKeyRef.current !== destKey) {
        return;
      }

      fullRoutePointsRef.current = routePoints || [];
      lastPassedIndexRef.current = 0;
      animateRouteDraw(routePoints);
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

  const distanceToRoute = useCallback((lat, lng, routePoints) => {
    if (!routePoints || routePoints.length < 2) return Infinity;
    let minDist = Infinity;
    for (let i = 0; i < routePoints.length; i++) {
      const d = haversineMeters(lat, lng, routePoints[i].latitude, routePoints[i].longitude);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }, []);

  useEffect(() => {
    const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
    const destinationMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');

    // Logique de sélection de la cible active :
    // - Si pickup_origin est présent, on est en phase 2 (course en cours) : cible = destination finale.
    // - Sinon, la cible est le premier marqueur trouvé (pickup pour l'approche, destination pour le preview).
    const targetMarker = pickupMarker || destinationMarker;
    const activeTarget = pickupOriginMarker ? destinationMarker : targetMarker;

    if (!activeTarget || !location) {
      stopDrawAnimation();
      setVisibleRoutePoints([]);
      fullRoutePointsRef.current = [];
      lastRouteOriginRef.current = null;
      lastRouteDestKeyRef.current = null;
      lastPassedIndexRef.current = 0;
      return;
    }

    // Détermination de l'origine du tracé selon la phase :
    // - Phase 1 (approche, marqueur 'pickup') : origine = position du chauffeur (driverLocation).
    //   Si driverLocation est absent (pas encore reçu via socket), on utilise location comme
    //   fallback pour ne pas bloquer le tracé indéfiniment.
    // - Phase 2 (course en cours, pickup_origin présent) : origine = position du chauffeur
    //   (driverLocation côté passager, ou location côté chauffeur qui passe sa propre position).
    //   Le chauffeur passe location=sa_position et driverLocation=sa_position également,
    //   donc l'un ou l'autre convient. On privilégie driverLocation si disponible.
    const hasDriverPosition = driverLocation?.latitude != null && driverLocation?.longitude != null;
    const routeOriginLat = hasDriverPosition ? driverLocation.latitude : location.latitude;
    const routeOriginLng = hasDriverPosition ? driverLocation.longitude : location.longitude;

    const distToTarget = haversineMeters(
      routeOriginLat,
      routeOriginLng,
      activeTarget.latitude,
      activeTarget.longitude
    );

    // Pas de tracé si on est déjà sur la cible
    if (distToTarget <= 25) {
      stopDrawAnimation();
      setVisibleRoutePoints([]);
      fullRoutePointsRef.current = [];
      return;
    }

    // Clé unique intégrant le type de cible pour forcer un recalcul complet
    // lors du passage de la phase 1 (pickup) à la phase 2 (destination).
    // Sans cela, l'ancienne route reste affichée lors de la transition.
    const destKey = `TARGET_${activeTarget.type}_${activeTarget.latitude.toFixed(5)},${activeTarget.longitude.toFixed(5)}`;

    if (destKey !== lastRouteDestKeyRef.current) {
      // Nouvelle cible détectée : purge complète de l'état précédent puis recalcul.
      // Cette purge est critique pour la transition phase 1 -> phase 2 :
      // elle garantit que l'ancienne route (approche) disparaît immédiatement
      // avant que la nouvelle (vers destination) ne soit calculée.
      stopDrawAnimation();
      setVisibleRoutePoints([]);
      fullRoutePointsRef.current = [];
      lastPassedIndexRef.current = 0;

      fetchAndStoreRoute(
        { latitude: routeOriginLat, longitude: routeOriginLng },
        { latitude: activeTarget.latitude, longitude: activeTarget.longitude },
        destKey
      );
      return;
    }

    const full = fullRoutePointsRef.current;
    if (!full || full.length === 0) return;

    const deviationDist = distanceToRoute(routeOriginLat, routeOriginLng, full);
    if (deviationDist > DEVIATION_THRESHOLD_METERS) {
      if (!isDrawingRouteRef.current) {
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

    if (movedDist >= TRIM_THRESHOLD_METERS) {
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
    distanceToRoute,
  ]);

  useEffect(() => {
    return () => stopDrawAnimation();
  }, [stopDrawAnimation]);

  return { visibleRoutePoints };
};

export default useRouteManager;