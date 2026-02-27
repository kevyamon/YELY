// src/components/map/MapCard.jsx
// COMPOSANT CARTE - Routage OSRM, Animation Progressive & Architecture Bypass Autonome
//
// AVERTISSEMENT ARCHITECTURAL - NE PAS MODIFIER SANS LIRE CECI :
// La Polyline est calculee DEPUIS L'INTERIEUR de ce composant, jamais depuis le parent.
// Sur react-native-maps/Android, passer des coordonnees de route depuis le parent
// provoque une Race Condition sur le Native Bridge : la ligne se trace vers un marqueur
// pas encore monte physiquement, causant un Silent Failure (ligne invisible, sans erreur).
// Architecture : la carte observe ses propres marqueurs et deduit la route par elle-meme.
// Ne jamais remonter ce calcul dans RiderHome.jsx ou DriverHome.jsx.

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline, UrlTile } from 'react-native-maps';

import MapService from '../../services/mapService';
import THEME from '../../theme/theme';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const LIGHT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// Duree de l'animation de dessin progressif de la route (ms)
const ROUTE_DRAW_DURATION_MS = 900;
// Intervalle entre chaque point revele lors de l'animation (ms)
const ROUTE_DRAW_INTERVAL_MS = 16;

// Calcule combien de points afficher a chaque frame pour
// completer l'animation en ROUTE_DRAW_DURATION_MS.
const computeStepSize = (totalPoints) => {
  const totalFrames = ROUTE_DRAW_DURATION_MS / ROUTE_DRAW_INTERVAL_MS;
  return Math.max(1, Math.ceil(totalPoints / totalFrames));
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

  // Tableau de coordonnees de route affiche a l'ecran.
  // Demarre vide et se remplit progressivement (animation de dessin).
  const [visibleRoutePoints, setVisibleRoutePoints] = useState([]);

  // Reference vers le timer d'animation pour nettoyage propre.
  const drawIntervalRef = useRef(null);
  // Derniere cle de route calculee : evite de recalculer si A et B n'ont pas change.
  const lastRouteKeyRef = useRef(null);

  const colorScheme = useColorScheme();
  const isMapDark = autoContrast ? !(colorScheme === 'dark') : (colorScheme === 'dark');
  const mapBackgroundColor = isMapDark ? '#262626' : '#F5F5F5';

  const safeLocation = location?.latitude && location?.longitude ? location : MAFERE_CENTER;

  // Arrete proprement toute animation de dessin en cours.
  const stopDrawAnimation = useCallback(() => {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
  }, []);

  // Lance l'animation de dessin progressif d'un tableau de points de route.
  // Les points se revelent de A vers B a intervalle fixe jusqu'a afficher la totalite.
  const animateRouteDraw = useCallback((fullPoints) => {
    stopDrawAnimation();
    setVisibleRoutePoints([]);

    if (!fullPoints || fullPoints.length === 0) return;

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

  // Calcule et anime la route entre deux points via OSRM.
  // Cette fonction est l'unique source de verite pour le trace.
  // Elle est appelee exclusivement depuis l'interieur de ce composant
  // (jamais depuis le parent) pour respecter l'architecture bypass Android.
  const computeAndDrawRoute = useCallback(async (pointA, pointB) => {
    if (!pointA || !pointB) {
      stopDrawAnimation();
      setVisibleRoutePoints([]);
      lastRouteKeyRef.current = null;
      return;
    }

    const routeKey = `${pointA.latitude.toFixed(5)},${pointA.longitude.toFixed(5)}|${pointB.latitude.toFixed(5)},${pointB.longitude.toFixed(5)}`;

    // Si la route est deja calculee pour ces deux points, ne rien refaire.
    if (routeKey === lastRouteKeyRef.current) return;
    lastRouteKeyRef.current = routeKey;

    const routePoints = await MapService.getRouteCoordinates(pointA, pointB);
    animateRouteDraw(routePoints);
  }, [animateRouteDraw, stopDrawAnimation]);

  // Observateur autonome des marqueurs (architecture bypass Android).
  // La carte determine elle-meme quels points relier, sans instruction du parent.
  //
  // Logique de selection du trace :
  // - Un marqueur 'pickup'      -> trace : position utilisateur → pickup
  // - Un marqueur 'destination' -> trace : position utilisateur → destination
  // - Un marqueur 'pickup_origin' (phase ongoing chauffeur) :
  //     trace fixe : point de rencontre → destination
  //     (le chauffeur a pris le client, on trace vers la destination)
  useEffect(() => {
    const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
    const destinationMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');

    if (pickupOriginMarker && destinationMarker) {
      // Phase ongoing cote chauffeur : trace fixe pickup → destination
      computeAndDrawRoute(
        { latitude: pickupOriginMarker.latitude, longitude: pickupOriginMarker.longitude },
        { latitude: destinationMarker.latitude, longitude: destinationMarker.longitude }
      );
      return;
    }

    const activeTarget = pickupMarker || destinationMarker;
    if (location && activeTarget) {
      computeAndDrawRoute(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: activeTarget.latitude, longitude: activeTarget.longitude }
      );
      return;
    }

    // Aucun marqueur pertinent : on efface le trace
    stopDrawAnimation();
    setVisibleRoutePoints([]);
    lastRouteKeyRef.current = null;
  }, [location, markers, computeAndDrawRoute, stopDrawAnimation]);

  // Centrage automatique de la carte sur les deux points du trace actif.
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

    if (isMapReady && pickupOriginMarker && destinationMarker) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: pickupOriginMarker.latitude, longitude: pickupOriginMarker.longitude },
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

  // Nettoyage des timers a la destruction du composant
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

            // Marqueur 'pickup_origin' : point de rencontre fixe en phase ongoing chauffeur.
            // Affiche uniquement comme repere visuel (point dore), sans interaction.
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