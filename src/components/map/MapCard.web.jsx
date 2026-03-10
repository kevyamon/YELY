// src/components/map/MapCard.web.jsx
// COMPOSANT ORCHESTRATEUR CARTE WEB - Injection CSS Dynamique & Metro Ready
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

import L from 'leaflet';
// SUPPRESSION DU CRASH METRO : import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, TileLayer, useMapEvents } from 'react-leaflet';

import usePoiSocketEvents from '../../hooks/usePoiSocketEvents';
import useRouteManager from '../../hooks/useRouteManager';
import { useGetAllPOIsQuery } from '../../store/api/poiApiSlice';
import THEME from '../../theme/theme';
import { MAFERE_CENTER } from '../../utils/mafereZone';
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

const POI_SVG = `<svg viewBox="0 0 24 24" fill="#FFFFFF" width="14" height="14"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

const createPoiIcon = (poi) => {
  const color = poi.iconColor || THEME.COLORS.champagneGold;
  const fullName = poi.name || '';
  
  const htmlContent = `
    <div style="display: flex; flex-direction: column; align-items: center; width: 26px; overflow: visible;">
      <div style="width: 26px; height: 26px; border-radius: 13px; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;">
        ${POI_SVG}
      </div>
      <div style="margin-top: 2px; font-size: 13px; font-weight: 800; color: #121418; text-shadow: 0px 0px 4px rgba(255,255,255,0.9), 0px 0px 2px rgba(255,255,255,1); text-align: center; white-space: nowrap;">
        ${fullName}
      </div>
    </div>
  `;

  return L.divIcon({
    className: '', 
    html: htmlContent,
    iconSize: [26, 26],
    iconAnchor: [13, 26], 
  });
};

const MapInteractionTracker = ({ onInteract }) => {
  useMapEvents({
    dragstart: onInteract,
    zoomstart: onInteract,
    mousedown: onInteract,
    touchstart: onInteract,
  });
  return null;
};

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
  
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const interactionTimeout = useRef(null);

  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const [isButtonActive, setIsButtonActive] = useState(true);
  const buttonSleepTimeout = useRef(null);

  // INJECTION DYNAMIQUE DU CSS LEAFLET (Contournement Metro Bundler)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
    }
  }, []);

  const wakeUpButton = () => {
    setIsButtonActive(true);
    Animated.timing(buttonOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false, 
    }).start();

    clearTimeout(buttonSleepTimeout.current);
    buttonSleepTimeout.current = setTimeout(() => {
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false, 
      }).start(() => setIsButtonActive(false));
    }, 10000); 
  };

  useEffect(() => {
    wakeUpButton();
    return () => clearTimeout(buttonSleepTimeout.current);
  }, []);

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

  const handleRecenter = () => {
    wakeUpButton();
    setIsUserInteracting(false); 
    if (location && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.latitude, location.longitude], 15, { duration: 0.8 });
    }
  };

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([region.latitude, region.longitude], 15, { duration: 0.8 });
      }
    },
    fitToCoordinates: () => {}, 
    centerOnUser: handleRecenter,
  }));

  const center = [
    location?.latitude || MAFERE_CENTER.latitude,
    location?.longitude || MAFERE_CENTER.longitude,
  ];

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
        <MapInteractionTracker onInteract={handleMapInteraction} />

        <TileLayer
          url={darkMode ? DARK_TILE_URL : LIGHT_TILE_URL}
          attribution={ATTRIBUTION}
          maxZoom={19}
        />

        <MapAutoFitter 
          location={location} 
          driverLocation={driverLocation} 
          markers={displayMarkers} 
          isUserInteracting={isUserInteracting}
          mapTopPadding={mapTopPadding}
          mapBottomPadding={mapBottomPadding}
        />

        {mapPOIs.map((poi) => (
          <Marker
            key={`map-poi-${poi._id || poi.id}`}
            position={[poi.latitude, poi.longitude]}
            icon={createPoiIcon(poi)}
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
        <Animated.View 
          style={[styles.recenterButtonWrapper, { bottom: mapBottomPadding + 16, opacity: buttonOpacity }]}
          pointerEvents={isButtonActive ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={handleRecenter}
            activeOpacity={0.8}
          >
            <Ionicons name="locate-outline" size={22} color={THEME.COLORS.champagneGold} />
          </TouchableOpacity>
        </Animated.View>
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
  recenterButtonWrapper: { 
    position: 'absolute', 
    right: THEME.SPACING.lg, 
    zIndex: 1000 
  },
  recenterButton: {
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