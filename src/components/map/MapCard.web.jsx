// src/components/map/MapCard.web.jsx
// COMPOSANT ORCHESTRATEUR CARTE WEB - Injection CSS Dynamique & Metro Ready (Force Light Theme)
// CSCSM Level: Bank Grade (Avec Cinematic Focus UX)

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

const LIGHT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO';

const createPoiIcon = (poi) => {
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
  isDriver = false,
  rideStatus = null, // AJOUT : Indispensable pour le Cinematic Focus
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

  // --- UX : CINEMATIC FOCUS (Version Web) ---
  const isCinematicMode = isRouteValid || rideStatus !== null;
  const visiblePOIs = isCinematicMode ? [] : mapPOIs;

  return (
    <View style={[styles.container, style]}>
      <View style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden', zIndex: -1 }}>
        {mapPOIs.map((poi) => (
          <UniversalIcon key={`preload-poi-${poi._id || poi.id}`} iconString={poi.icon} size={10} color="transparent" />
        ))}
        {markers.map((marker, index) => (
          marker.icon ? <UniversalIcon key={`preload-marker-${index}`} iconString={marker.icon} size={10} color="transparent" /> : null
        ))}
      </View>

      <MapContainer
        center={center}
        zoom={15}
        style={{ width: '100%', height: '100%', backgroundColor: '#FAFAFA' }}
        zoomControl={false}
        attributionControl={false}
        ref={(mapInstance) => { if (mapInstance) mapInstanceRef.current = mapInstance; }}
        whenReady={() => onMapReady?.()}
      >
        <MapInteractionTracker onInteract={handleMapInteraction} />

        <TileLayer
          url={LIGHT_TILE_URL}
          attribution={ATTRIBUTION}
          maxZoom={19}
        />

        <MapAutoFitter 
          location={location} 
          driverLocation={driverLocation} 
          markers={markers} 
          isUserInteracting={isUserInteracting}
          mapTopPadding={mapTopPadding}
          mapBottomPadding={mapBottomPadding}
        />

        {/* Cinematic Focus appliqué ici : on map sur visiblePOIs et non mapPOIs */}
        {visiblePOIs.map((poi) => (
          <Marker
            key={`map-poi-${poi._id || poi.id}`}
            position={[poi.latitude, poi.longitude]}
            icon={createPoiIcon(poi)}
            eventHandlers={{ click: () => onMarkerPress?.(poi) }}
          />
        ))}

        {showUserMarker && !isOngoingRide && location && !isDriver && (
          <Marker position={[location.latitude, location.longitude]} icon={userIcon} />
        )}

        {driverLocation?.latitude && driverLocation?.longitude && (
          <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={driverIcon} />
        )}

        {markers.map((marker, index) => {
          if (!marker.latitude || !marker.longitude) return null;

          let markerIcon = defaultIcon;
          
          if (marker.type === 'pickup') {
            if (isDriver) {
               markerIcon = pickupIcon; 
            } else {
               return null;
            }
          }
          else if (marker.type === 'destination') {
            // Héritage Visuel de la destination
            if (marker.icon) {
                markerIcon = createPoiIcon({
                  icon: marker.icon,
                  iconColor: marker.iconColor || THEME.COLORS.danger,
                  name: marker.name || "Destination"
                });
            } else {
                markerIcon = destinationIcon;
            }
          }
          else if (marker.type === 'pickup_origin') return null; 
          else if (marker.icon) {
              const mColor = marker.iconColor || THEME.COLORS.champagneGold;
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
    backgroundColor: '#FAFAFA'
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
    if (typeof loc1.latitude !== 'number' || typeof loc2.latitude !== 'number') return false;
    if (typeof loc1.longitude !== 'number' || typeof loc2.longitude !== 'number') return false;
    
    return loc1.latitude.toFixed(4) === loc2.latitude.toFixed(4) && 
           loc1.longitude.toFixed(4) === loc2.longitude.toFixed(4);
  };

  return (
    isSameLocation(prevProps.location, nextProps.location) &&
    isSameLocation(prevProps.driverLocation, nextProps.driverLocation) &&
    prevProps.markers?.length === nextProps.markers?.length &&
    prevProps.mapBottomPadding === nextProps.mapBottomPadding &&
    prevProps.showUserMarker === nextProps.showUserMarker &&
    prevProps.isDriver === nextProps.isDriver &&
    prevProps.rideStatus === nextProps.rideStatus // CORRECTION : Forcer le re-rendu lors des changements de statut
  );
};

export default React.memo(MapCard, arePropsEqual);