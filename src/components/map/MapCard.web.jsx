// src/components/map/MapCard.web.jsx
// COMPOSANT CARTE WEB - Spécial Maféré

import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import THEME from '../../theme/theme';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';

const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

// 🚀 NOUVEAU : Coordonnées de Maféré
const MAFERE_COORDS = [5.4053, -3.0531];

// 🚀 NOUVEAU : Limites pour bloquer la carte sur la région
const MAP_BOUNDS = L.latLngBounds(
  L.latLng(5.2000, -3.3000), // Sud-Ouest
  L.latLng(5.6000, -2.8000)  // Nord-Est
);

const userIcon = L.divIcon({
  className: 'yely-user-marker',
  html: `
    <div style="
      width: 34px; height: 34px;
      display: flex; justify-content: center; align-items: center;
      position: relative;
    ">
      <div style="
        position: absolute; width: 34px; height: 34px;
        border-radius: 50%; background: rgba(212, 175, 55, 0.15);
      "></div>
      <div style="
        width: 14px; height: 14px; border-radius: 50%;
        background: #D4AF37; border: 2.5px solid #FFFFFF;
        z-index: 1;
      "></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const defaultIcon = L.divIcon({
  className: 'yely-default-marker',
  html: `
    <div style="
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(18, 20, 24, 0.92);
      border: 0.5px solid rgba(242, 244, 246, 0.10);
      display: flex; justify-content: center; align-items: center;
    ">
      <span style="color: #D4AF37; font-size: 20px;">📍</span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const MapCenterUpdater = ({ location }) => {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], 15, {
        duration: 1,
      });
    }
  }, [location, map]);

  return null;
};

const MapCard = forwardRef(({
  location,
  markers = [],
  route = null,
  showUserMarker = true,
  showRecenterButton = true,
  darkMode = true,
  onMapReady,
  onPress,
  onMarkerPress,
  style,
  children,
}, ref) => {
  const mapInstanceRef = useRef(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(
          [region.latitude, region.longitude],
          15,
          { duration: 0.8 }
        );
      }
    },
    fitToCoordinates: (coords) => {
      if (mapInstanceRef.current && coords.length > 0) {
        const bounds = L.latLngBounds(
          coords.map((c) => [c.latitude, c.longitude])
        );
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    },
    centerOnUser: () => {
      if (location && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(
          [location.latitude, location.longitude],
          15,
          { duration: 0.8 }
        );
      }
    },
  }));

  // 🚀 LOGIQUE : Utilise Maféré si le GPS n'est pas encore là
  const center = [
    location?.latitude || MAFERE_COORDS[0],
    location?.longitude || MAFERE_COORDS[1],
  ];

  return (
    <View style={[styles.container, style]}>
      <MapContainer
        center={center}
        zoom={15} // Zoom adapté pour voir une ville moyenne
        minZoom={12} // 🚀 Empêche de dézoomer trop loin
        maxBounds={MAP_BOUNDS} // 🚀 Bloque la carte sur la région
        maxBoundsViscosity={1.0} // Rebondit sur les bords
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
        ref={(mapInstance) => {
          if (mapInstance) {
            mapInstanceRef.current = mapInstance;
          }
        }}
        whenReady={() => onMapReady?.()}
      >
        <TileLayer
          url={darkMode ? DARK_TILE_URL : LIGHT_TILE_URL}
          attribution={ATTRIBUTION}
          maxZoom={19}
        />

        <MapCenterUpdater location={location} />

        {showUserMarker && location && (
          <Marker
            position={[location.latitude, location.longitude]}
            icon={userIcon}
          />
        )}

        {markers.map((marker, index) => (
          <Marker
            key={marker.id || `marker-${index}`}
            position={[marker.latitude, marker.longitude]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => onMarkerPress?.(marker),
            }}
          />
        ))}

        {route && route.coordinates && route.coordinates.length > 0 && (
          <Polyline
            positions={route.coordinates.map((c) => [c.latitude, c.longitude])}
            pathOptions={{
              color: route.color || THEME.COLORS.champagneGold,
              weight: route.width || 4,
              dashArray: route.dashed ? '10 5' : undefined,
            }}
          />
        )}
      </MapContainer>

      {showRecenterButton && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={() => {
            if (location && mapInstanceRef.current) {
              mapInstanceRef.current.flyTo(
                [location.latitude, location.longitude],
                15,
                { duration: 0.8 }
              );
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
    overflow: 'hidden',
    position: 'relative',
    borderBottomWidth: THEME.BORDERS.width.thin,
    borderBottomColor: THEME.COLORS.glassBorder,
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
    zIndex: 1000,
  },
});

export default MapCard;