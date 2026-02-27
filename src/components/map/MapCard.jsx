// src/components/map/MapCard.jsx
// COMPOSANT CARTE - Lissage GPS & Architecture Autonome Stricte
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline, UrlTile } from 'react-native-maps';

import THEME from '../../theme/theme';
import { MAFERE_CENTER } from '../../utils/mafereZone';

const LIGHT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const generateBezierCurve = (start, end) => {
  if (!start || !end) return [];
  const sLat = Number(start.latitude), sLng = Number(start.longitude);
  const eLat = Number(end.latitude), eLng = Number(end.longitude);
  if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) return [];

  const points = [];
  const midLat = (sLat + eLat) / 2, midLng = (sLng + eLng) / 2;
  const dLat = eLat - sLat, dLng = eLng - sLng;
  const curveFactor = 0.2; 
  const ctrlLat = midLat - (dLng * curveFactor), ctrlLng = midLng + (dLat * curveFactor);

  for (let t = 0; t <= 1; t += 0.02) {
    const u = 1 - t, tt = t * t, uu = u * u;
    points.push({ 
      latitude: uu * sLat + 2 * u * t * ctrlLat + tt * eLat, 
      longitude: uu * sLng + 2 * u * t * ctrlLng + tt * eLng 
    }); 
  }
  return points;
};

const TrackedMarker = ({ coordinate, anchor, children, zIndex, identifier }) => {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracks(false), 500);
    return () => clearTimeout(timer);
  }, []);
  return <Marker identifier={identifier} coordinate={coordinate} anchor={anchor} tracksViewChanges={tracks} zIndex={zIndex}>{children}</Marker>;
};

const AnimatedPickupMarker = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
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
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
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
  recenterBottomPadding = THEME.SPACING.lg 
}, ref) => {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [arcCoordinates, setArcCoordinates] = useState([]);
  
  const colorScheme = useColorScheme();
  const isMapDark = autoContrast ? !(colorScheme === 'dark') : (colorScheme === 'dark');
  const mapBackgroundColor = isMapDark ? '#262626' : '#F5F5F5';
  
  const safeLocation = location?.latitude && location?.longitude ? location : MAFERE_CENTER;

  useEffect(() => {
    const activeTarget = markers.find(m => m.type === 'pickup') || markers.find(m => m.type === 'destination');
    
    if (location && activeTarget) {
      const timer = setTimeout(() => {
        setArcCoordinates(generateBezierCurve(location, activeTarget));
      }, 150); 
      return () => clearTimeout(timer);
    } else {
      setArcCoordinates([]);
    }
  }, [location, markers]);

  useEffect(() => {
    const activeTarget = markers.find(m => m.type === 'pickup') || markers.find(m => m.type === 'destination');
    
    if (isMapReady && location && driverLocation && !activeTarget) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
          ],
          { edgePadding: { top: 150, right: 70, bottom: recenterBottomPadding + 40, left: 70 }, animated: true }
        );
      }, 600); 
      return () => clearTimeout(timer);
    }
    else if (isMapReady && location && activeTarget) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: activeTarget.latitude, longitude: activeTarget.longitude }
          ],
          { edgePadding: { top: 280, right: 70, bottom: recenterBottomPadding + 40, left: 70 }, animated: true }
        );
      }, 600); 
      return () => clearTimeout(timer);
    }
  }, [markers, isMapReady, location, driverLocation, recenterBottomPadding]);

  const handleRecenter = () => {
    if (isMapReady && location) {
      mapRef.current?.animateToRegion({ latitude: safeLocation.latitude, longitude: safeLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 800);
    }
  };

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 800) => { if (isMapReady) mapRef.current?.animateToRegion(region, duration); },
    fitToCoordinates: (coords, options) => { if (isMapReady) mapRef.current?.fitToCoordinates(coords, options); },
    centerOnUser: handleRecenter,
  }));

  const handleMapReady = () => { setIsMapReady(true); if (onMapReady) onMapReady(); };

  return (
    <View style={[styles.container, floating && styles.floating, style, { backgroundColor: mapBackgroundColor }]}>
      <View style={[styles.mapClip, !floating && styles.mapClipEdge, { backgroundColor: mapBackgroundColor }]}>
        <MapView
          ref={mapRef}
          style={[styles.map, { backgroundColor: mapBackgroundColor }]} 
          initialRegion={{ latitude: safeLocation.latitude, longitude: safeLocation.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
          mapType="none" 
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false} 
          onMapReady={handleMapReady} 
          onPress={onPress}
        >
          <UrlTile urlTemplate={isMapDark ? DARK_TILE_URL : LIGHT_TILE_URL} maximumZ={19} flipY={false} shouldReplaceMapContent={true} tileSize={256} fadeDuration={0} zIndex={-1} />

          {arcCoordinates.length > 0 && (
            <Polyline coordinates={arcCoordinates} strokeColor="#D4AF37" strokeWidth={4} zIndex={50} />
          )}

          {showUserMarker && location && (
            <TrackedMarker identifier="user_loc" coordinate={{ latitude: safeLocation.latitude, longitude: safeLocation.longitude }} anchor={{ x: 0.5, y: 0.5 }} zIndex={100}>
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

            return (
              <TrackedMarker key={marker.id || `marker-${index}`} coordinate={{ latitude: marker.latitude, longitude: marker.longitude }} anchor={{ x: 0.5, y: 0.5 }} zIndex={90}>
                <View onTouchEnd={() => onMarkerPress?.(marker)}>
                  {marker.customView || <View style={[styles.defaultMarker, marker.style]}><Ionicons name={marker.icon || 'location'} size={marker.iconSize || 20} color={marker.iconColor || THEME.COLORS.champagneGold} /></View>}
                </View>
              </TrackedMarker>
            );
          })}
          {children}
        </MapView>
      </View>

      {showRecenterButton && (
        <TouchableOpacity style={[styles.recenterButton, { bottom: recenterBottomPadding }]} activeOpacity={0.8} onPress={handleRecenter}>
          <Ionicons name="locate-outline" size={24} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      )}
    </View>
  );
});

MapCard.displayName = 'MapCard';

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  floating: { marginHorizontal: THEME.SPACING.md, marginVertical: THEME.SPACING.sm, borderRadius: THEME.BORDERS.radius.xxl, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.glassBorder, overflow: 'hidden', ...THEME.SHADOWS.medium },
  mapClip: { ...StyleSheet.absoluteFillObject, borderRadius: THEME.BORDERS.radius.xxl, overflow: 'hidden', zIndex: 1 },
  mapClipEdge: { borderRadius: 0 },
  map: { width: '100%', height: '100%' },
  userMarker: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  userMarkerPulse: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(212, 175, 55, 0.3)' }, 
  userMarkerInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: THEME.COLORS.champagneGold, borderWidth: 2.5, borderColor: '#FFFFFF' },
  defaultMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.glassBorder },
  recenterButton: { position: 'absolute', right: THEME.SPACING.lg, width: 52, height: 52, borderRadius: 26, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: THEME.COLORS.champagneGold, zIndex: 999, elevation: 999 },
  animatedMarkerContainer: { justifyContent: 'center', alignItems: 'center', width: 50, height: 50 },
  pulseHalo: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  markerIconShadow: { textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4, elevation: 5 },
  humanMarkerBg: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 5 },
  carMarkerContainer: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  carMarkerBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E1E1E', borderWidth: 2, borderColor: THEME.COLORS.champagneGold, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
});

export default React.memo(MapCard);