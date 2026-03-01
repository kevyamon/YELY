// src/components/map/MapCard.jsx
// COMPOSANT CARTE - Routage OSRM, Animation Progressive & Securite Asynchrone
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline, UrlTile } from 'react-native-maps';

import MapService from '../../services/mapService';
import THEME from '../../theme/theme';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const LIGHT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const ROUTE_DRAW_DURATION_MS = 900;
const ROUTE_DRAW_INTERVAL_MS = 16;
const REROUTE_THRESHOLD_METERS = 40;
const DEVIATION_THRESHOLD_METERS = 60;

const computeStepSize = (totalPoints) => {
  const totalFrames = ROUTE_DRAW_DURATION_MS / ROUTE_DRAW_INTERVAL_MS;
  return Math.max(1, Math.ceil(totalPoints / totalFrames));
};

const haversineMeters = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const findClosestPointIndex = (routePoints, currentLat, currentLng) => {
  if (!routePoints || routePoints.length === 0) return 0;
  let minDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < routePoints.length; i++) {
    const d = haversineMeters(currentLat, currentLng, routePoints[i].latitude, routePoints[i].longitude);
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
    const d = haversineMeters(lat, lng, routePoints[i].latitude, routePoints[i].longitude);
    if (d < minDist) minDist = d;
  }
  return minDist;
};

const TrackedMarker = ({ coordinate, anchor, children, zIndex, identifier }) => {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracks(false), 500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Marker
      identifier={identifier}
      coordinate={coordinate}
      anchor={anchor}
      tracksViewChanges={tracks}
      zIndex={zIndex}
    >
      {children}
    </Marker>
  );
};

const AnimatedPickupMarker = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.8, 0.4] });

  return (
    <View style={styles.animatedMarkerContainer}>
      <Animated.View style={[styles.pulseHalo, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <View style={[styles.humanMarkerBg, { backgroundColor: color }]}>
        <Ionicons name="accessibility" size={24} color="#FFFFFF" style={styles.markerIconShadow} />
      </View>
    </View>
  );
};

const AnimatedDestinationMarker = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 0.3] });

  return (
    <View style={styles.animatedMarkerContainer}>
      <Animated.View style={[styles.pulseHalo, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <Ionicons name="flag" size={32} color={color} style={styles.markerIconShadow} />
    </View>
  );
};

const SmoothDriverMarker = ({ coordinate, heading }) => {
  const [markerCoordinate] = useState(
    new AnimatedRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  );

  useEffect(() => {
    markerCoordinate.timing({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [coordinate, markerCoordinate]);

  return (
    <Marker.Animated
      coordinate={markerCoordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={200}
      flat={true}
      rotation={heading || 0}
    >
      <View style={styles.carMarkerContainer}>
        <View style={styles.carMarkerBg}>
          <Ionicons name="car-sport" size={20} color={THEME.COLORS.champagneGold} />
        </View>
      </View>
    </Marker.Animated>
  );
};

const MapCard = forwardRef(({
  location,
  driverLocation,
  markers = [],
  showUserMarker = true,
  showRecenterButton = true,
  floating = false,
  autoContrast = true,
  onMapReady,
  onPress,
  onMarkerPress,
  style,
  children,
  recenterBottomPadding = THEME.SPACING.lg,
}, ref) => {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const [visibleRoutePoints, setVisibleRoutePoints] = useState([]);

  const drawIntervalRef = useRef(null);
  const isDrawingRouteRef = useRef(false);

  const fullRoutePointsRef = useRef([]);
  const lastRouteOriginRef = useRef(null);
  const lastRouteDestKeyRef = useRef(null);

  const colorScheme = useColorScheme();
  const isMapDark = autoContrast ? !(colorScheme === 'dark') : (colorScheme === 'dark');
  const mapBackgroundColor = isMapDark ? '#262626' : '#F5F5F5';

  const safeLocation = location?.latitude && location?.longitude ? location : MAFERE_CENTER;

  const stopDrawAnimation = useCallback(() => {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
    isDrawingRouteRef.current = false;
  }, []);

  const animateRouteDraw = useCallback((fullPoints) => {
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
  }, [stopDrawAnimation]);

  const fetchAndStoreRoute = useCallback(async (pointA, pointB) => {
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

    // VERROU D'OBSOLESCENCE (Stale Check Asynchrone)
    // Empeche la carte de dessiner un trace "fantome" si la course a ete annulee
    // ou nettoyee pendant le delai de resolution de la requete reseau.
    if (lastRouteDestKeyRef.current !== destKey) {
      return;
    }

    fullRoutePointsRef.current = routePoints || [];
    animateRouteDraw(routePoints);
  }, [animateRouteDraw, stopDrawAnimation]);

  const trimRouteFromCurrentPosition = useCallback((currentLat, currentLng) => {
    const full = fullRoutePointsRef.current;
    if (!full || full.length < 2) return;

    const closestIdx = findClosestPointIndex(full, currentLat, currentLng);
    const remaining = full.slice(closestIdx);
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

    const currentLat = location.latitude;
    const currentLng = location.longitude;
    const destKey = `${activeTarget.latitude.toFixed(5)},${activeTarget.longitude.toFixed(5)}`;

    if (destKey !== lastRouteDestKeyRef.current) {
      fetchAndStoreRoute(
        { latitude: currentLat, longitude: currentLng },
        { latitude: activeTarget.latitude, longitude: activeTarget.longitude }
      );
      return;
    }

    const full = fullRoutePointsRef.current;

    const deviationDist = distanceToRoute(currentLat, currentLng, full);
    if (deviationDist > DEVIATION_THRESHOLD_METERS) {
      if (!isDrawingRouteRef.current) {
        fetchAndStoreRoute(
          { latitude: currentLat, longitude: currentLng },
          { latitude: activeTarget.latitude, longitude: activeTarget.longitude }
        );
      }
      return;
    }

    const lastOrigin = lastRouteOriginRef.current;
    const movedDist = lastOrigin
      ? haversineMeters(currentLat, currentLng, lastOrigin.latitude, lastOrigin.longitude)
      : REROUTE_THRESHOLD_METERS + 1;

    if (movedDist >= REROUTE_THRESHOLD_METERS) {
      if (!isDrawingRouteRef.current) {
        lastRouteOriginRef.current = { latitude: currentLat, longitude: currentLng };
        trimRouteFromCurrentPosition(currentLat, currentLng);
      }
    }
  }, [location, markers, fetchAndStoreRoute, trimRouteFromCurrentPosition, stopDrawAnimation]);

  useEffect(() => {
    const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
    const destinationMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');
    const activeTarget = pickupMarker || destinationMarker;

    if (isMapReady && location && driverLocation && !activeTarget) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
          ],
          { edgePadding: { top: 150, right: 70, bottom: recenterBottomPadding + 40, left: 70 }, animated: true }
        );
      }, 600);
      return () => clearTimeout(timer);
    }

    if (isMapReady && pickupOriginMarker && destinationMarker && location) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: destinationMarker.latitude, longitude: destinationMarker.longitude },
          ],
          { edgePadding: { top: 280, right: 70, bottom: recenterBottomPadding + 40, left: 70 }, animated: true }
        );
      }, 600);
      return () => clearTimeout(timer);
    }

    if (isMapReady && location && activeTarget) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: activeTarget.latitude, longitude: activeTarget.longitude },
          ],
          { edgePadding: { top: 280, right: 70, bottom: recenterBottomPadding + 40, left: 70 }, animated: true }
        );
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [markers, isMapReady, location, driverLocation, recenterBottomPadding]);

  useEffect(() => {
    return () => stopDrawAnimation();
  }, [stopDrawAnimation]);

  const handleRecenter = () => {
    if (isMapReady && location) {
      mapRef.current?.animateToRegion(
        { latitude: safeLocation.latitude, longitude: safeLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        800
      );
    }
  };

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 800) => { if (isMapReady) mapRef.current?.animateToRegion(region, duration); },
    fitToCoordinates: (coords, options) => { if (isMapReady) mapRef.current?.fitToCoordinates(coords, options); },
    centerOnUser: handleRecenter,
  }));

  const handleMapReady = () => {
    setIsMapReady(true);
    if (onMapReady) onMapReady();
  };

  return (
    <View style={[styles.container, floating && styles.floating, style, { backgroundColor: mapBackgroundColor }]}>
      <View style={[styles.mapClip, !floating && styles.mapClipEdge, { backgroundColor: mapBackgroundColor }]}>
        <MapView
          ref={mapRef}
          style={[styles.map, { backgroundColor: mapBackgroundColor }]}
          initialRegion={{
            latitude: safeLocation.latitude,
            longitude: safeLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          mapType="none"
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          maxZoomLevel={17}
          onMapReady={handleMapReady}
          onPress={onPress}
        >
          <UrlTile
            urlTemplate={isMapDark ? DARK_TILE_URL : LIGHT_TILE_URL}
            maximumZ={17}
            flipY={false}
            shouldReplaceMapContent={true}
            tileSize={256}
            fadeDuration={0}
            zIndex={-1}
          />

          {visibleRoutePoints.length > 1 && (
            <Polyline
              coordinates={visibleRoutePoints}
              strokeColor={THEME.COLORS.champagneGold}
              strokeWidth={4}
              zIndex={50}
            />
          )}

          {showUserMarker && location && (
            <TrackedMarker
              identifier="user_loc"
              coordinate={{ latitude: safeLocation.latitude, longitude: safeLocation.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={100}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerPulse} />
                <View style={styles.userMarkerInner} />
              </View>
            </TrackedMarker>
          )}

          {driverLocation && (
            <SmoothDriverMarker coordinate={driverLocation} heading={driverLocation.heading} />
          )}

          {markers.map((marker, index) => {
            if (!marker.latitude || !marker.longitude) return null;

            if (marker.type === 'pickup') {
              return (
                <Marker
                  identifier="pickup_loc"
                  key={marker.id || `marker-${index}`}
                  coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  zIndex={120}
                  tracksViewChanges={true}
                >
                  <AnimatedPickupMarker color={marker.iconColor || THEME.COLORS.info || '#2196F3'} />
                </Marker>
              );
            }

            if (marker.type === 'destination') {
              return (
                <Marker
                  identifier="dest_loc"
                  key={marker.id || `marker-${index}`}
                  coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                  anchor={{ x: 0.28, y: 0.85 }}
                  zIndex={110}
                  tracksViewChanges={true}
                >
                  <AnimatedDestinationMarker color={marker.iconColor || THEME.COLORS.danger} />
                </Marker>
              );
            }

            if (marker.type === 'pickup_origin') {
              return (
                <TrackedMarker
                  identifier="pickup_origin_loc"
                  key={marker.id || `marker-${index}`}
                  coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  zIndex={90}
                >
                  <View style={styles.originDot} />
                </TrackedMarker>
              );
            }

            return (
              <TrackedMarker
                key={marker.id || `marker-${index}`}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={90}
              >
                <View onTouchEnd={() => onMarkerPress?.(marker)}>
                  {marker.customView || (
                    <View style={[styles.defaultMarker, marker.style]}>
                      <Ionicons
                        name={marker.icon || 'location'}
                        size={marker.iconSize || 20}
                        color={marker.iconColor || THEME.COLORS.champagneGold}
                      />
                    </View>
                  )}
                </View>
              </TrackedMarker>
            );
          })}

          {children}
        </MapView>
      </View>

      {showRecenterButton && (
        <TouchableOpacity
          style={[styles.recenterButton, { bottom: recenterBottomPadding }]}
          activeOpacity={0.8}
          onPress={handleRecenter}
        >
          <Ionicons name="locate-outline" size={24} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      )}
    </View>
  );
});

MapCard.displayName = 'MapCard';

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  floating: {
    marginHorizontal: THEME.SPACING.md,
    marginVertical: THEME.SPACING.sm,
    borderRadius: THEME.BORDERS.radius.xxl,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
    overflow: 'hidden',
    ...THEME.SHADOWS.medium,
  },
  mapClip: { ...StyleSheet.absoluteFillObject, borderRadius: THEME.BORDERS.radius.xxl, overflow: 'hidden', zIndex: 1 },
  mapClipEdge: { borderRadius: 0 },
  map: { width: '100%', height: '100%' },
  userMarker: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  userMarkerPulse: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(212, 175, 55, 0.3)' },
  userMarkerInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: THEME.COLORS.champagneGold, borderWidth: 2.5, borderColor: '#FFFFFF' },
  defaultMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.COLORS.glassDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
  },
  originDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.COLORS.champagneGold,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    opacity: 0.7,
  },
  recenterButton: {
    position: 'absolute',
    right: THEME.SPACING.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.COLORS.glassDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.COLORS.champagneGold,
    zIndex: 999,
    elevation: 999,
  },
  animatedMarkerContainer: { justifyContent: 'center', alignItems: 'center', width: 50, height: 50 },
  pulseHalo: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  markerIconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    elevation: 5,
  },
  humanMarkerBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  carMarkerContainer: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  carMarkerBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default React.memo(MapCard);