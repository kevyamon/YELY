// src/components/map/MapCard.jsx
// COMPOSANT ORCHESTRATEUR CARTE MOBILE - Hack OSM "None" & Mode Veille Actif
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';

import usePoiSocketEvents from '../../hooks/usePoiSocketEvents';
import useRouteManager from '../../hooks/useRouteManager';
import { useGetAllPOIsQuery } from '../../store/api/poiApiSlice';
import THEME from '../../theme/theme';
import { MAFERE_CENTER } from '../../utils/mafereZone';
import {
  AnimatedDestinationMarker,
  AnimatedPickupMarker,
  AnimatedTrackedMarker,
  PoiMarker,
  SmoothDriverMarker,
  TrackedMarker,
} from './markers/MobileMarkers';
import useMapAutoFitter from './useMapAutoFitter';

const LIGHT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const MapCard = forwardRef(({
  location,
  driverLocation,
  markers = [],
  showUserMarker = true,
  showRecenterButton = true,
  floating = false,
  mapTopPadding = 140,
  mapBottomPadding = 240,
  onMapReady,
  onPress,
  onMarkerPress,
  style,
  children,
}, ref) => {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const interactionTimeout = useRef(null);

  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const [isButtonActive, setIsButtonActive] = useState(true);
  const buttonSleepTimeout = useRef(null);

  const wakeUpButton = () => {
    setIsButtonActive(true);
    Animated.timing(buttonOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    clearTimeout(buttonSleepTimeout.current);
    buttonSleepTimeout.current = setTimeout(() => {
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setIsButtonActive(false));
    }, 10000); 
  };

  useEffect(() => {
    wakeUpButton();
    return () => clearTimeout(buttonSleepTimeout.current);
  }, []);

  const isMapDark = false; 
  const mapBackgroundColor = '#FAFAFA';

  const safeLocation = location?.latitude && location?.longitude ? location : MAFERE_CENTER;
  const { visibleRoutePoints } = useRouteManager(location, driverLocation, markers);

  usePoiSocketEvents();
  const { data: poiResponse } = useGetAllPOIsQuery();
  const mapPOIs = poiResponse?.data || [];

  const handleMapInteraction = () => {
    wakeUpButton();
    setIsUserInteracting(true);
    clearTimeout(interactionTimeout.current);
    interactionTimeout.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 1000);
  };

  useMapAutoFitter({
    isMapReady,
    mapRef,
    location,
    driverLocation,
    markers,
    mapTopPadding,
    mapBottomPadding,
    isUserInteracting
  });

  const handleRecenter = () => {
    wakeUpButton();
    setIsUserInteracting(false);
    if (isMapReady && location && location.latitude) {
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
          // 🔥 LE FAMEUX HACK : On coupe le moteur Google et on laisse juste le canevas blanc
          mapType="none" 
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsPointsOfInterest={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          
          rotateEnabled={true}
          pitchEnabled={true}
          zoomEnabled={true}
          scrollEnabled={true}
          
          onTouchStart={handleMapInteraction}
          onPanDrag={handleMapInteraction}
          onRegionChangeComplete={(region, details) => {
            if (details?.isGesture) {
              handleMapInteraction();
            }
          }}
          
          maxZoomLevel={17}
          onMapReady={handleMapReady}
          onPress={onPress}
        >
          {/* 🔥 NOS TUILES OSM QUI SE DESSINENT PAR DESSUS */}
          <UrlTile
            urlTemplate={isMapDark ? DARK_TILE_URL : LIGHT_TILE_URL}
            maximumZ={17}
            flipY={false}
            shouldReplaceMapContent={false}
            tileSize={256}
            fadeDuration={0}
            zIndex={1}
          />

          {visibleRoutePoints.length > 1 && (
            <Polyline
              coordinates={visibleRoutePoints}
              strokeColor={THEME.COLORS.champagneGold}
              strokeWidth={4}
              zIndex={50}
            />
          )}

          {mapPOIs.map((poi) => (
            <PoiMarker
              key={`map-poi-${poi._id || poi.id}-${poi.name}-${poi.latitude}-${poi.longitude}`}
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              name={poi.name}
              icon={poi.icon}
              color={poi.iconColor}
              onPress={() => onMarkerPress?.(poi)}
            />
          ))}

          {showUserMarker && location && location.latitude && (
            <AnimatedTrackedMarker
              identifier="user_loc"
              coordinate={{ latitude: safeLocation.latitude, longitude: safeLocation.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={100}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerPulse} />
                <View style={styles.userMarkerInner} />
              </View>
            </AnimatedTrackedMarker>
          )}

          {driverLocation && driverLocation.latitude && driverLocation.longitude && (
            <SmoothDriverMarker
              coordinate={driverLocation}
              heading={driverLocation.heading}
            />
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

            if (marker.type === 'pickup_origin') return null;

            return (
              <TrackedMarker
                key={marker.id || `marker-${index}`}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={90}
              >
                <View onTouchEnd={() => onMarkerPress?.(marker)} style={styles.customMarkerWrapper}>
                  {marker.customView || (
                    <View style={[styles.defaultMarker, marker.style]}>
                      <Ionicons
                        name={marker.icon || 'location'}
                        size={marker.iconSize || 20}
                        color={marker.iconColor || THEME.COLORS.champagneGold}
                      />
                    </View>
                  )}
                  {marker.name && (
                    <Text style={styles.markerLabel}>{marker.name}</Text>
                  )}
                </View>
              </TrackedMarker>
            );
          })}

          {children}
        </MapView>
      </View>

      {showRecenterButton && (
        <Animated.View 
          style={[styles.recenterButtonWrapper, { bottom: mapBottomPadding + 16, opacity: buttonOpacity }]}
          pointerEvents={isButtonActive ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.recenterButton}
            activeOpacity={0.8}
            onPress={handleRecenter}
          >
            <Ionicons name="locate-outline" size={24} color={THEME.COLORS.champagneGold} />
          </TouchableOpacity>
        </Animated.View>
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
  customMarkerWrapper: { alignItems: 'center', justifyContent: 'center' },
  defaultMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.glassBorder },
  markerLabel: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11, backgroundColor: 'rgba(18, 20, 24, 0.75)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', marginTop: 4, textAlign: 'center' },
  recenterButtonWrapper: { position: 'absolute', right: THEME.SPACING.lg, zIndex: 999, elevation: 999 },
  recenterButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: THEME.COLORS.champagneGold },
});

const arePropsEqual = (prevProps, nextProps) => {
  const isSameLocation = (loc1, loc2) => {
    if (!loc1 && !loc2) return true;
    if (!loc1 || !loc2) return false;
    return loc1.latitude.toFixed(4) === loc2.latitude.toFixed(4) && 
           loc1.longitude.toFixed(4) === loc2.longitude.toFixed(4);
  };

  return (
    isSameLocation(prevProps.location, nextProps.location) &&
    isSameLocation(prevProps.driverLocation, nextProps.driverLocation) &&
    prevProps.markers?.length === nextProps.markers?.length &&
    prevProps.mapBottomPadding === nextProps.mapBottomPadding &&
    prevProps.showUserMarker === nextProps.showUserMarker
  );
};

export default React.memo(MapCard, arePropsEqual);