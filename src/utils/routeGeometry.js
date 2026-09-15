// src/utils/routeGeometry.js
// CALCULS GÉOMÉTRIQUES & PROJECTION D'ITINÉRAIRE
// CSCSM Level: Bank Grade (Modularisation < 325 lignes, Sans Emojis)

export const ROUTE_DRAW_DURATION_MS = 300;
export const ROUTE_DRAW_INTERVAL_MS = 16;
export const TRIM_THRESHOLD_METERS = 2;
export const DEVIATION_THRESHOLD_METERS = 60;
export const FAST_RETRY_DELAY_MS = 400;
export const SILENT_RETRY_DELAY_MS = 6000;

export const fetchWithRetry = async (url, options = {}, retries = 2, delayMs = 300) => {
  const { timeout = 4000, ...fetchOpts } = options;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.ok) return response;
      if (attempt === retries) return response;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
  }
};

export const computeStepSize = (totalPoints, durationMs = ROUTE_DRAW_DURATION_MS, intervalMs = ROUTE_DRAW_INTERVAL_MS) => {
  const totalFrames = durationMs / intervalMs;
  return Math.max(1, Math.ceil(totalPoints / totalFrames));
};

export const haversineMeters = (lat1, lng1, lat2, lng2) => {
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

export const getProjectedPoint = (A, B, P) => {
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

export const distSq = (p1, p2) =>
  Math.pow(p1.latitude - p2.latitude, 2) + Math.pow(p1.longitude - p2.longitude, 2);

export const distanceToRoute = (lat, lng, routePoints) => {
  if (!routePoints || !Array.isArray(routePoints) || routePoints.length < 2) return Infinity;
  let minDist = Infinity;
  for (let i = 0; i < routePoints.length; i++) {
    const pt = routePoints[i];
    if (pt && pt.latitude != null && pt.longitude != null) {
      const d = haversineMeters(lat, lng, pt.latitude, pt.longitude);
      if (d < minDist) minDist = d;
    }
  }
  return minDist;
};
