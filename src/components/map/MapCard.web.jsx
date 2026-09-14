// src/components/map/MapCard.web.jsx
// COMPOSANT ORCHESTRATEUR CARTE WEB - OpenStreetMap Officiel (100% Gratuit, Zéro Filigrane)
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMapEvents } from 'react-leaflet';

import usePoiSocketEvents from '../../hooks/usePoiSocketEvents';
import useRouteManager from '../../hooks/useRouteManager';
import { useGetAllPOIsQuery } from '../../store/api/poiApiSlice';
import THEME from '../../theme/theme';
import { MAFERE_CENTER } from '../../utils/mafereZone';
import UniversalIcon from '../ui/UniversalIcon';
import {
  MapAutoFitter,
  defaultIcon,
  destinationIcon,
  driverIcon,
  pickupIcon,
  userIcon
} from './markers/WebMarkers';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const poiIconCache = new Map();

const resolvePoiCollisions = (pois, zoom) => {
  if (!pois || pois.length === 0) return [];
  
  let threshold = 0.0004;
  if (zoom >= 18) threshold = 0.0001;
  else if (zoom === 17) threshold = 0.0002;
  else if (zoom === 16) threshold = 0.0004;
  else if (zoom === 15) threshold = 0.0007;
  else if (zoom === 14) threshold = 0.0015;
  else threshold = 0.0030;

  const processed = [];

  for (let i = 0; i < pois.length; i++) {
    const current = { ...pois[i] };
    const curLat = Number(current.latitude);
    const curLng = Number(current.longitude);
    if (isNaN(curLat) || isNaN(curLng)) continue;

    let hasCollision = false;
    for (const p of processed) {
      const pLat = Number(p.latitude);
      const pLng = Number(p.longitude);

      if (Math.abs(curLat - pLat) < threshold && Math.abs(curLng - pLng) < threshold) {
        hasCollision = true;
        break;
      }
    }
    
    if (!hasCollision) {
      current.showLabel = true;
      processed.push(current);
    }
  }
  return processed;
};

const createPoiIcon = (poi) => {
  const cacheKey = `${poi._id || poi.id || poi.name}_${poi.iconColor || ''}_${poi.showLabel !== false}`;
  if (poiIconCache.has(cacheKey)) {
    return poiIconCache.get(cacheKey);
  }

  const color = poi.iconColor || THEME.COLORS.champagneGold;
  const fullName = poi.name || '';
  
  const iconHtml = renderToString(
    <UniversalIcon iconString={poi.icon || 'Ionicons/location'} size={14} color="#FFFFFF" />
  );

  const htmlContent = `
    <div style="display: flex; flex-direction: column; align-items: center; width: 26px; overflow: visible;">
      <div style="width: 26px; height: 26px; border-radius: 13px; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;">
        ${iconHtml}
      </div>
      ${poi.showLabel !== false ? `
      <div style="margin-top: 2px; font-size: 12px; font-weight: 800; color: #121418; text-shadow: 0px 0px 4px rgba(255,255,255,0.9), 0px 0px 2px rgba(255,255,255,1); text-align: center; white-space: nowrap;">
        ${fullName}
      </div>
      ` : ''}
    </div>
  `;

  const icon = L.divIcon({
    className: '', 
    html: htmlContent,
    iconSize: [26, 26],
    iconAnchor: [13, 26], 
  });

  poiIconCache.set(cacheKey, icon);
  return icon;
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

const MapEventsHandler = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    }
  });
  return null;
};

const MapCard = forwardRef(({
  location,
  driverLocation,
  markers = [],
  isDriver = false,
  rideStatus = null, 
  showUserMarker = true,
  showRecenterButton = true,
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
  const [currentZoom, setCurrentZoom] = useState(15);

  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
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
    }, 8000); 
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
      if (mapInstanceRef.current && region?.latitude && region?.longitude) {
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

  const polylinePositions = (visibleRoutePoints || [])
    .map(p => [p?.latitude, p?.longitude])
    .filter(p => p && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && !isNaN(p[0]) && !isNaN(p[1]))
    .reduce((acc, current) => {
       if (acc.length === 0) return [current];
       const prev = acc[acc.length - 1];
       if (prev[0] !== current[0] || prev[1] !== current[1]) {
           acc.push(current);
       }
       return acc;
    }, []);

  const isRouteValid = polylinePositions.length > 1;
  const isOngoingRide = rideStatus === 'in_progress' || rideStatus === 'ongoing';

  useEffect(() => {
    if (isRouteValid) {
      setIsUserInteracting(false);
    }
  }, [isRouteValid]);

  const isCinematicMode = isRouteValid || rideStatus !== null;
  const visiblePOIs = isCinematicMode ? [] : resolvePoiCollisions(mapPOIs, currentZoom);

  return (
    <View style={[styles.container, style]}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ width: '100%', height: '100%', backgroundColor: '#F8F9FA' }}
        zoomControl={false}
        attributionControl={false}
        ref={(mapInstance) => { if (mapInstance) mapInstanceRef.current = mapInstance; }}
        whenReady={() => onMapReady?.()}
      >
        <MapEventsHandler onZoomChange={setCurrentZoom} />
        <MapInteractionTracker onInteract={handleMapInteraction} />

        <TileLayer
          url={TILE_URL}
          attribution={ATTRIBUTION}
          maxZoom={19}
        />

        <MapAutoFitter 
          location={location} 
          driverLocation={driverLocation} 
          markers={markers} 
          routePoints={visibleRoutePoints}
          isUserInteracting={isUserInteracting}
          mapTopPadding={mapTopPadding}
          mapBottomPadding={mapBottomPadding}
        />

        {visiblePOIs.map((poi) => (
          <Marker
            key={`map-poi-${poi._id || poi.id}`}
            position={[poi.latitude, poi.longitude]}
            icon={createPoiIcon(poi)}
            eventHandlers={{ click: () => onMarkerPress?.(poi) }}
          />
        ))}

        {showUserMarker && !isOngoingRide && location && !isDriver && !isNaN(Number(location.latitude)) && !isNaN(Number(location.longitude)) && (
          <Marker position={[Number(location.latitude), Number(location.longitude)]} icon={userIcon} />
        )}

        {driverLocation && !isNaN(Number(driverLocation.latitude)) && !isNaN(Number(driverLocation.longitude)) && (
          <Marker position={[Number(driverLocation.latitude), Number(driverLocation.longitude)]} icon={driverIcon} />
        )}

        {markers.map((marker, index) => {
          const mLat = Number(marker.latitude);
          const mLng = Number(marker.longitude);
          if (isNaN(mLat) || isNaN(mLng) || !marker.latitude || !marker.longitude) return null;

          let markerIcon = defaultIcon;
          
          if (marker.type === 'pickup') {
            if (isDriver) markerIcon = pickupIcon;
            else return null;
          } else if (marker.type === 'destination') {
            if (marker.icon) {
              markerIcon = createPoiIcon({
                icon: marker.icon,
                iconColor: marker.iconColor || THEME.COLORS.danger,
                name: marker.name || "Destination"
              });
            } else {
              markerIcon = destinationIcon;
            }
          } else if (marker.type === 'pickup_origin') {
            return null;
          } else if (marker.icon) {
            const mHtml = renderToString(<UniversalIcon iconString={marker.icon} size={18} color="#FFFFFF" />);
            markerIcon = L.divIcon({
              className: '',
              html: `<div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(18, 20, 24, 0.92); border: 0.5px solid rgba(242, 244, 246, 0.10); display: flex; justify-content: center; align-items: center;">${mHtml}</div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            });
          }

          return (
            <Marker
              key={marker.id || `marker-${index}`}
              position={[marker.latitude, marker.longitude]}
              icon={markerIcon}
              eventHandlers={{ click: () => onMarkerPress?.(marker) }}
            />
          );
        })}

        {isRouteValid && (
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
    backgroundColor: '#F8F9FA'
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

export default React.memo(MapCard);