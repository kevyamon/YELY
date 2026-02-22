// src/components/map/MapCard.jsx
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
// 🚀 On remet Animated !
import { Animated, Easing, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import MapView, { Marker, Polygon, Polyline, UrlTile } from 'react-native-maps';

import THEME from '../../theme/theme';
import { MAFERE_CENTER, MAFERE_KML_ZONE } from '../../utils/mafereZone';

const LIGHT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// 🚀 GÉNÉRATEUR MATHÉMATIQUE (Blindé avec Number() pour contrer le texte)
const generateBezierCurve = (start, end) => {
  if (!start || !end) return [];

  const sLat = Number(start.latitude);
  const sLng = Number(start.longitude);
  const eLat = Number(end.latitude);
  const eLng = Number(end.longitude);

  if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) return [];

  const points = [];
  const midLat = (sLat + eLat) / 2;
  const midLng = (sLng + eLng) / 2;
  const dLat = eLat - sLat;
  const dLng = eLng - sLng;
  const curveFactor = 0.2; 
  const ctrlLat = midLat - (dLng * curveFactor); 
  const ctrlLng = midLng + (dLat * curveFactor);

  for (let t = 0; t <= 1; t += 0.02) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const pLat = uu * sLat + 2 * u * t * ctrlLat + tt * eLat;
    const pLng = uu * sLng + 2 * u * t * ctrlLng + tt * eLng;
    points.push({ latitude: pLat, longitude: pLng }); 
  }
  return points;
};

// 🚀 TON COMPOSANT ANIMÉ D'ORIGINE (Restauré)
const AnimatedDestinationMarker = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 0.3] });

  return (
    <View style={styles.animatedMarkerContainer}>
      <Animated.View style={[styles.pulseHalo, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <Ionicons name="flag" size={28} color={color} style={styles.markerIconShadow} />
    </View>
  );
};

const MapCard = forwardRef(({
  location,
  markers = [],
  route = null,
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
  
  const colorScheme = useColorScheme();
  const isAppDark = colorScheme === 'dark';
  const isMapDark = autoContrast ? !isAppDark : isAppDark;

  const safeLocation = location?.latitude && location?.longitude ? location : MAFERE_CENTER;

  // 🚀 CORRECTION : Fonction de recentrage propre
  const handleRecenter = () => {
    if (isMapReady && location) {
      mapRef.current?.animateToRegion({
        latitude: safeLocation.latitude,
        longitude: safeLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800);
    }
  };

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 800) => {
      if (isMapReady) mapRef.current?.animateToRegion(region, duration);
    },
    fitToCoordinates: (coords, options) => {
      if (isMapReady) mapRef.current?.fitToCoordinates(coords, options);
    },
    centerOnUser: handleRecenter, // Lié proprement
  }));

  useEffect(() => {
    if (isMapReady && location) {
      mapRef.current?.animateToRegion({
        latitude: safeLocation.latitude,
        longitude: safeLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [location, isMapReady]);

  const handleMapReady = () => {
    setIsMapReady(true);
    if (onMapReady) onMapReady();
  };

  const mapBackgroundColor = isMapDark ? '#262626' : '#F5F5F5';

  const arcCoordinates = useMemo(() => {
    if (route && route.start && route.end) {
      return generateBezierCurve(route.start, route.end);
    }
    return [];
  }, [route]);

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
          onMapReady={handleMapReady} 
          onPress={onPress}
        >
          <UrlTile
            urlTemplate={isMapDark ? DARK_TILE_URL : LIGHT_TILE_URL}
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent={true} 
            tileSize={256}
            fadeDuration={0} 
          />

          {MAFERE_KML_ZONE && MAFERE_KML_ZONE.length > 0 && (
            <Polygon
              coordinates={MAFERE_KML_ZONE}
              fillColor="rgba(212, 175, 55, 0.15)"
              strokeColor={THEME.COLORS.champagneGold}
              strokeWidth={2}
              lineDashPattern={[10, 5]}
            />
          )}

          {/* 🚀 ON A SUPPRIMÉ tracksViewChanges QUI CACHAIT LES POINTS */}
          {showUserMarker && location && (
            <Marker
              coordinate={{ latitude: safeLocation.latitude, longitude: safeLocation.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerPulse} />
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          )}

          {markers.map((marker, index) => {
            if (!marker.latitude || !marker.longitude) return null;
            const isDestination = marker.type === 'destination';
            const anchor = isDestination ? { x: 0.5, y: 0.8 } : { x: 0.5, y: 0.5 }; 

            return (
              <Marker
                key={marker.id || `marker-${index}`}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                anchor={anchor} 
                onPress={() => onMarkerPress?.(marker)}
              >
                {isDestination ? (
                  <AnimatedDestinationMarker color={marker.iconColor || THEME.COLORS.danger} />
                ) : (
                  marker.customView || (
                    <View style={[styles.defaultMarker, marker.style]}>
                      <Ionicons name={marker.icon || 'location'} size={marker.iconSize || 20} color={marker.iconColor || THEME.COLORS.champagneGold} />
                    </View>
                  )
                )}
              </Marker>
            );
          })}

          {/* 🚀 L'ARC AVEC SÉCURITÉ FORMAT DE DONNÉES */}
          {arcCoordinates.length > 0 && (
            <Polyline
              key={`arc-${arcCoordinates.length}`}
              coordinates={arcCoordinates}
              strokeColor={route?.color || THEME.COLORS.champagneGold}
              strokeWidth={4}
              geodesic={true}
              zIndex={100}
            />
          )}

          {children}
        </MapView>
      </View>

      {showRecenterButton && (
        <TouchableOpacity
          style={[styles.recenterButton, { bottom: recenterBottomPadding }]}
          activeOpacity={0.8}
          onPress={handleRecenter} /* 🚀 L'APPEL CORRIGÉ ICI */
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
  floating: { marginHorizontal: THEME.SPACING.md, marginVertical: THEME.SPACING.sm, borderRadius: THEME.BORDERS.radius.xxl, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.glassBorder, overflow: 'hidden', ...THEME.SHADOWS.medium },
  mapClip: { ...StyleSheet.absoluteFillObject, borderRadius: THEME.BORDERS.radius.xxl, overflow: 'hidden', zIndex: 1 },
  mapClipEdge: { borderRadius: 0 },
  map: { width: '100%', height: '100%' },
  userMarker: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  userMarkerPulse: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(212, 175, 55, 0.4)' },
  userMarkerInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: THEME.COLORS.champagneGold, borderWidth: 2.5, borderColor: '#FFFFFF' },
  defaultMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.glassBorder },
  recenterButton: { position: 'absolute', right: THEME.SPACING.lg, width: 52, height: 52, borderRadius: 26, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: THEME.COLORS.champagneGold, zIndex: 999, elevation: 999 },
  animatedMarkerContainer: { justifyContent: 'center', alignItems: 'center', width: 50, height: 50 },
  pulseHalo: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  markerIconShadow: { textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4, elevation: 5 }
});

export default React.memo(MapCard);