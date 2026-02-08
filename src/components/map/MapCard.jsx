// src/components/map/MapCard.jsx

import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';

import THEME from '../../theme/theme';

// Tuiles gratuites (pas de clé API, pas de facturation)
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const MapCard = forwardRef(({
  location,
  markers = [],
  route = null,
  showUserMarker = true,
  showRecenterButton = true,
  darkMode = true,
  floating = true,
  onMapReady,
  onPress,
  onMarkerPress,
  style,
  children,
}, ref) => {
  const mapRef = useRef(null);

  // Exposer des méthodes au parent via ref
  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 800) => {
      mapRef.current?.animateToRegion(region, duration);
    },
    fitToCoordinates: (coords, options) => {
      mapRef.current?.fitToCoordinates(coords, options);
    },
    centerOnUser: () => {
      if (location) {
        mapRef.current?.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 800);
      }
    },
  }));

  // Centrer la carte sur la position de l'utilisateur au premier chargement
  useEffect(() => {
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, [location]);

  const initialRegion = {
    latitude: location?.latitude || 5.3600,
    longitude: location?.longitude || -4.0083,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={[
      styles.container,
      floating && styles.floating,
      style,
    ]}>
      <View style={styles.mapClip}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          mapType="none"
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={false}
          onMapReady={onMapReady}
          onPress={onPress}
        >
          {/* Tuiles OpenStreetMap gratuites */}
          <UrlTile
            urlTemplate={darkMode ? DARK_TILE_URL : OSM_TILE_URL}
            maximumZ={19}
            flipY={false}
          />

          {/* Marqueur utilisateur personnalisé */}
          {showUserMarker && location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerPulse} />
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          )}

          {/* Marqueurs dynamiques (chauffeurs, destination, etc.) */}
          {markers.map((marker, index) => (
            <Marker
              key={marker.id || `marker-${index}`}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
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
          ))}

          {/* Tracé de l'itinéraire */}
          {route && route.coordinates && route.coordinates.length > 0 && (
            <Polyline
              coordinates={route.coordinates}
              strokeColor={route.color || THEME.COLORS.champagneGold}
              strokeWidth={route.width || 4}
              lineDashPattern={route.dashed ? [10, 5] : undefined}
            />
          )}

          {/* Contenu additionnel (enfants) */}
          {children}
        </MapView>
      </View>

      {/* Bouton recentrer */}
      {showRecenterButton && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={() => {
            if (location) {
              mapRef.current?.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }, 800);
            }
          }}
        >
          <Ionicons name="locate-outline" size={22} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      )}
    </View>
  );
});

MapCard.displayName = 'MapCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  floating: {
    marginHorizontal: THEME.SPACING.md,
    marginVertical: THEME.SPACING.sm,
    borderRadius: THEME.BORDERS.radius.xxl,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
    overflow: 'hidden',
    ...THEME.SHADOWS.medium,
  },
  mapClip: {
    flex: 1,
    borderRadius: THEME.BORDERS.radius.xxl,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  userMarker: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.COLORS.champagneGold,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
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
  recenterButton: {
    position: 'absolute',
    bottom: THEME.SPACING.lg,
    right: THEME.SPACING.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.COLORS.glassDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
  },
});

export default MapCard;