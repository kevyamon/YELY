// src/components/map/MapCard.jsx
// COMPOSANT CARTE - Correction Z-Index du Bouton de Recentrage

import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';

import THEME from '../../theme/theme';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const MapCard = forwardRef(({
  location,
  markers = [],
  route = null,
  showUserMarker = true,
  showRecenterButton = true,
  darkMode = true,
  floating = false, 
  onMapReady,
  onPress,
  onMarkerPress,
  style,
  children,
  recenterBottomPadding = THEME.SPACING.lg 
}, ref) => {
  const mapRef = useRef(null);

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
      {/* CORRECTION : Le bloc mapClip n'a plus d'overflow hidden strict 
        qui couperait les éléments flottants enfants 
      */}
      <View style={[styles.mapClip, !floating && styles.mapClipEdge]}>
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
          <UrlTile
            urlTemplate={darkMode ? DARK_TILE_URL : OSM_TILE_URL}
            maximumZ={19}
            flipY={false}
          />

          {showUserMarker && location && (
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerPulse} />
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          )}

          {markers.map((marker, index) => (
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
          ))}

          {route && route.coordinates && route.coordinates.length > 0 && (
            <Polyline
              coordinates={route.coordinates}
              strokeColor={route.color || THEME.COLORS.champagneGold}
              strokeWidth={route.width || 4}
              lineDashPattern={route.dashed ? [10, 5] : undefined}
            />
          )}

          {children}
        </MapView>
      </View>

      {/* CORRECTION : Le bouton est placé HORS de mapClip, directement dans le container.
        Cela garantit qu'il flotte au-dessus de la carte sans être coupé.
      */}
      {showRecenterButton && (
        <TouchableOpacity
          style={[styles.recenterButton, { bottom: recenterBottomPadding }]}
          activeOpacity={0.8}
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
          <Ionicons name="locate-outline" size={24} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      )}
    </View>
  );
});

MapCard.displayName = 'MapCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative', // Nécessaire pour que le bouton absolu se repère par rapport à ce conteneur
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
    ...StyleSheet.absoluteFillObject, // Remplit tout le conteneur parent
    borderRadius: THEME.BORDERS.radius.xxl,
    overflow: 'hidden',
    zIndex: 1, // La carte est en dessous
  },
  mapClipEdge: {
    borderRadius: 0, 
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
    right: THEME.SPACING.lg, // Collé à droite
    width: 52,
    height: 52,
    borderRadius: 26, 
    backgroundColor: THEME.COLORS.glassDark, // Un fond sombre Yély fait mieux ressortir le bouton
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.COLORS.champagneGold, // Cerclage or
    
    // CORRECTION : Le Z-index massif pour forcer l'affichage au-dessus de MapView
    zIndex: 999, 
    elevation: 999, // Elevation Android vitale
    
    // Ombre dorée pour le style premium
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default MapCard;