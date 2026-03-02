// src/components/map/MapCard.jsx
// COMPOSANT ORCHESTRATEUR CARTE MOBILE - Interface et rendu pur
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';

import useRouteManager from '../../hooks/useRouteManager';
import THEME from '../../theme/theme';
import { MAFERE_CENTER } from '../../utils/mafereZone';
import {
  AnimatedDestinationMarker,
  AnimatedPickupMarker,
  SmoothDriverMarker,
  TrackedMarker,
} from './markers/MobileMarkers';

const LIGHT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

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
  
  const lastCameraSignatureRef = useRef('');

  const colorScheme = useColorScheme();
  const isMapDark = autoContrast ? !(colorScheme === 'dark') : (colorScheme === 'dark');
  const mapBackgroundColor = isMapDark ? '#262626' : '#F5F5F5';

  const safeLocation = location?.latitude && location?.longitude ? location : MAFERE_CENTER;

  const { visibleRoutePoints } = useRouteManager(location, driverLocation, markers);

  useEffect(() => {
    if (!isMapReady) return;

    const pickupOriginMarker = markers.find((m) => m.type === 'pickup_origin');
    const destinationMarker = markers.find((m) => m.type === 'destination');
    const pickupMarker = markers.find((m) => m.type === 'pickup');
    
    const activeTarget = pickupOriginMarker ? destinationMarker : (pickupMarker || destinationMarker);

    const currentSignature = activeTarget 
      ? `TARGET_${activeTarget.type}_${activeTarget.latitude}` 
      : 'IDLE_CLIENT_ONLY';

    if (lastCameraSignatureRef.current !== currentSignature) {
      lastCameraSignatureRef.current = currentSignature;

      if (!activeTarget && location) {
        const timer = setTimeout(() => {
          mapRef.current?.animateToRegion(
            { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
            800
          );
        }, 600);
        return () => clearTimeout(timer);
      } else if (activeTarget && driverLocation) {
        const timer = setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            [
              { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
              { latitude: activeTarget.latitude, longitude: activeTarget.longitude },
            ],
            { edgePadding: { top: 280, right: 70, bottom: recenterBottomPadding + 40, left: 70 }, animated: true }
          );
        }, 600);
        return () => clearTimeout(timer);
      } else if (activeTarget && location) {
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
    }
  }, [markers, isMapReady, recenterBottomPadding, location, driverLocation]);

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

  // REPARATION : Reintroduction de la fonction manquante
  const handleMapReady = () => {
    setIsMapReady(true);
    if (onMapReady) onMapReady();
  };

  const shouldShowUserMarker = showUserMarker;

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

          {shouldShowUserMarker && location && (
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
              return null;
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
  floating: { marginHorizontal: THEME.SPACING.md, marginVertical: THEME.SPACING.sm, borderRadius: THEME.BORDERS.radius.xxl, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.glassBorder, overflow: 'hidden', ...THEME.SHADOWS.medium },
  mapClip: { ...StyleSheet.absoluteFillObject, borderRadius: THEME.BORDERS.radius.xxl, overflow: 'hidden', zIndex: 1 },
  mapClipEdge: { borderRadius: 0 },
  map: { width: '100%', height: '100%' },
  userMarker: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  userMarkerPulse: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(212, 175, 55, 0.3)' },
  userMarkerInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: THEME.COLORS.champagneGold, borderWidth: 2.5, borderColor: '#FFFFFF' },
  defaultMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.glassBorder },
  recenterButton: { position: 'absolute', right: THEME.SPACING.lg, width: 52, height: 52, borderRadius: 26, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: THEME.COLORS.champagneGold, zIndex: 999, elevation: 999 },
});

export default React.memo(MapCard);