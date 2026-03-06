// src/components/map/MapCard.web.jsx
// COMPOSANT ORCHESTRATEUR CARTE WEB - Interface, POIs et Rendu Optimisé
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polygon, Polyline, TileLayer } from 'react-leaflet';

import usePoiSocketEvents from '../../hooks/usePoiSocketEvents';
import useRouteManager from '../../hooks/useRouteManager';
import { useGetAllPOIsQuery } from '../../store/api/poiApiSlice';
import THEME from '../../theme/theme';
import { MAFERE_CENTER, MAFERE_KML_ZONE } from '../../utils/mafereZone';
import {
  MapAutoFitter,
  defaultIcon,
  destinationIcon,
  driverIcon,
  pickupIcon,
  pickupOriginIcon,
  userIcon,
} from './markers/WebMarkers';

const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; OSM';

// Générateur d'icônes dynamiques pour les POIs sur le Web
const createPoiIcon = (color) => L.divIcon({
  className: 'yely-poi-marker',
  html: `<div style="width: 26px; height: 26px; border-radius: 13px; background: ${color || THEME.COLORS.champagneGold}; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

const MapCard = forwardRef(({
  location,
  driverLocation,
  markers = [],
  showUserMarker = true,
  showRecenterButton = true,
  darkMode = true,
  mapTopPadding = 140,
  mapBottomPadding = 240,
  onMapReady,
  onMarkerPress,
  style,
}, ref) => {
  const mapInstanceRef = useRef(null);

  const { visibleRoutePoints } = useRouteManager(location, driverLocation, markers);

  // ALIGNEMENT FONCTIONNEL : On récupère les POIs comme sur mobile
  usePoiSocketEvents();
  const { data: poiResponse } = useGetAllPOIsQuery();
  const mapPOIs = poiResponse?.data || [];

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([region.latitude, region.longitude], 15, { duration: 0.8 });
      }
    },
    fitToCoordinates: () => {}, // Géré de manière autonome par MapAutoFitter
    centerOnUser: () => {
      if (location && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([location.latitude, location.longitude], 15, { duration: 0.8 });
      }
    },
  }));

  const center = [
    location?.latitude || MAFERE_CENTER.latitude,
    location?.longitude || MAFERE_CENTER.longitude,
  ];

  const leafletKmlPositions = MAFERE_KML_ZONE.map((coord) => [coord.latitude, coord.longitude]);

  const displayMarkers = markers.filter(marker => {
    if (!showUserMarker && (marker.type === 'pickup' || marker.type === 'pickup_origin')) {
      return false;
    }
    return true;
  });

  const polylinePositions = visibleRoutePoints.map(p => [p.latitude, p.longitude]);

  return (
    <View style={[styles.container, style]}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
        ref={(mapInstance) => { if (mapInstance) mapInstanceRef.current = mapInstance; }}
        whenReady={() => onMapReady?.()}
      >
        <TileLayer
          url={darkMode ? DARK_TILE_URL : LIGHT_TILE_URL}
          attribution={ATTRIBUTION}
          maxZoom={19}
        />

        <MapAutoFitter 
          location={location} 
          driverLocation={driverLocation} 
          markers={displayMarkers} 
          routePoints={visibleRoutePoints}
          mapTopPadding={mapTopPadding}
          mapBottomPadding={mapBottomPadding}
        />

        {leafletKmlPositions.length > 0 && (
          <Polygon
            positions={leafletKmlPositions}
            pathOptions={{
              color: THEME.COLORS.champagneGold,
              fillColor: THEME.COLORS.champagneGold,
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '5, 5',
            }}
          />
        )}

        {mapPOIs.map((poi) => (
          <Marker
            key={`map-poi-${poi._id || poi.id}`}
            position={[poi.latitude, poi.longitude]}
            icon={createPoiIcon(poi.iconColor)}
            eventHandlers={{ click: () => onMarkerPress?.(poi) }}
          />
        ))}

        {showUserMarker && location && (
          <Marker position={[location.latitude, location.longitude]} icon={userIcon} />
        )}

        {driverLocation?.latitude && driverLocation?.longitude && (
          <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={driverIcon} />
        )}

        {displayMarkers.map((marker, index) => {
          if (!marker.latitude || !marker.longitude) return null;

          let markerIcon = defaultIcon;
          if (marker.type === 'pickup') markerIcon = pickupIcon;
          else if (marker.type === 'destination') markerIcon = destinationIcon;
          else if (marker.type === 'pickup_origin') markerIcon = pickupOriginIcon;

          return (
            <Marker
              key={marker.id || `marker-${index}`}
              position={[marker.latitude, marker.longitude]}
              icon={markerIcon}
              eventHandlers={{ click: () => onMarkerPress?.(marker) }}
            />
          );
        })}

        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: THEME.COLORS.champagneGold,
              weight: 4,
            }}
          />
        )}
      </MapContainer>

      {showRecenterButton && (
        <TouchableOpacity
          style={[styles.recenterButton, { bottom: mapBottomPadding + 16 }]}
          onPress={() => {
            if (location && mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([location.latitude, location.longitude], 15, { duration: 0.8 });
            }
          }}
        >
          <Ionicons name="locate-outline" size={22} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      )}
    </View>
  );
});

MapCard.displayName = 'MapCardWeb';

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

// MEMOIZATION STRICTE : Évite le re-rendu et le clignotement de la carte web
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