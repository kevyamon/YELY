// src/components/map/MapCard.jsx
// COMPOSANT CARTE - Intégration Dynamique KML
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import MapView, { Marker, Polygon, Polyline, UrlTile } from 'react-native-maps';

import THEME from '../../theme/theme';
import { MAFERE_CENTER, MAFERE_KML_ZONE } from '../../utils/mafereZone'; // 🚀 IMPORT DU FICHIER KML

const LIGHT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

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

  // Utilisation du centre défini dans le fichier mafereZone.js
  const safeLocation = location?.latitude && location?.longitude 
    ? location 
    : MAFERE_CENTER;

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 800) => {
      if (isMapReady) mapRef.current?.animateToRegion(region, duration);
    },
    fitToCoordinates: (coords, options) => {
      if (isMapReady) mapRef.current?.fitToCoordinates(coords, options);
    },
    centerOnUser: () => {
      if (isMapReady && location) {
        mapRef.current?.animateToRegion({
          latitude: safeLocation.latitude,
          longitude: safeLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 800);
      }
    },
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

  const initialRegion = {
    latitude: safeLocation.latitude,
    longitude: safeLocation.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const mapBackgroundColor = isMapDark ? '#262626' : '#F5F5F5';

  return (
    <View style={[
      styles.container,
      floating && styles.floating,
      style,
      { backgroundColor: mapBackgroundColor } 
    ]}>
      
      <View style={[
        styles.mapClip, 
        !floating && styles.mapClipEdge,
        { backgroundColor: mapBackgroundColor }
      ]}>
        <MapView
          ref={mapRef}
          style={[styles.map, { backgroundColor: mapBackgroundColor }]} 
          initialRegion={initialRegion}
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

          {/* 🚀 LECTURE DU KML DEPUIS LE FICHIER EXTERNE */}
          {MAFERE_KML_ZONE && MAFERE_KML_ZONE.length > 0 && (
            <Polygon
              coordinates={MAFERE_KML_ZONE}
              fillColor="rgba(212, 175, 55, 0.15)"
              strokeColor={THEME.COLORS.champagneGold}
              strokeWidth={2}
              lineDashPattern={[10, 5]}
            />
          )}

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
            return (
              <Marker
                key={marker.id || `marker-${index}`}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={marker.title || ''}
                description={marker.description || ''}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => onMarkerPress?.(marker)}
              >
                {marker.customView || (
                  <View style={[styles.defaultMarker, marker.style]}>
                    <Ionicons
                      name={marker.icon || 'location'}
                      size={marker.iconSize || 20}
                      color={marker.iconColor || THEME.COLORS.champagneGold}
                    />
                  </View>
                )}
              </Marker>
            );
          })}

          {route && route.coordinates && route.coordinates.length > 0 && (
            <Polyline
              coordinates={route.coordinates}
              strokeColor={route.color || THEME.COLORS.champagneGold}
              strokeWidth={route.width || 4}
            />
          )}

          {children}
        </MapView>
      </View>

      {showRecenterButton && (
        <TouchableOpacity
          style={[styles.recenterButton, { bottom: recenterBottomPadding }]}
          activeOpacity={0.8}
          onPress={() => {
            if (isMapReady && location) {
              mapRef.current?.animateToRegion({
                latitude: safeLocation.latitude,
                longitude: safeLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 800);
            }
          }}
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
  userMarkerPulse: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(212, 175, 55, 0.15)' },
  userMarkerInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: THEME.COLORS.champagneGold, borderWidth: 2.5, borderColor: '#FFFFFF' },
  defaultMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.glassBorder },
  recenterButton: { position: 'absolute', right: THEME.SPACING.lg, width: 52, height: 52, borderRadius: 26, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: THEME.COLORS.champagneGold, zIndex: 999, elevation: 999, shadowColor: THEME.COLORS.champagneGold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
});

export default React.memo(MapCard);