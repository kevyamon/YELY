// src/components/map/MapCard.web.jsx
// COMPOSANT CARTE WEB - Moteur Mathématique Arc Doré Balistique

import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import THEME from '../../theme/theme';
import { MAFERE_CENTER, MAFERE_KML_ZONE } from '../../utils/mafereZone';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polygon, Polyline, TileLayer, useMap } from 'react-leaflet';

const DARK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; OSM';

const userIcon = L.divIcon({
  className: 'yely-user-marker',
  html: `
    <div style="width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; position: relative;">
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(212, 175, 55, 0.15);"></div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background: #D4AF37; border: 2.5px solid #FFFFFF; z-index: 1;"></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const defaultIcon = L.divIcon({
  className: 'yely-default-marker',
  html: `
    <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(18, 20, 24, 0.92); border: 0.5px solid rgba(242, 244, 246, 0.10); display: flex; justify-content: center; align-items: center;">
      <span style="color: #D4AF37; font-size: 20px;">📍</span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const destinationIcon = L.divIcon({
  className: 'yely-destination-marker',
  html: `
    <div style="width: 50px; height: 50px; display: flex; justify-content: center; align-items: center; position: relative;">
      <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #E74C3C; animation: yely-pulse 1.5s infinite ease-in-out;"></div>
      <span style="color: #E74C3C; font-size: 28px; z-index: 1; text-shadow: 0px 2px 4px rgba(0,0,0,0.4);">🚩</span>
      <style>
        @keyframes yely-pulse {
          0% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(0.8); opacity: 0.3; }
        }
      </style>
    </div>
  `,
  iconSize: [50, 50],
  iconAnchor: [25, 45], 
});

const MapCenterUpdater = ({ location, hasRoute }) => {
  const map = useMap();
  useEffect(() => {
    if (location && !hasRoute) {
      map.flyTo([location.latitude, location.longitude], 15, { duration: 1 });
    }
  }, [location, map, hasRoute]);
  return null;
};

// 🚀 NOUVEAU : Le générateur mathématique de la courbe de Bézier (Évite totalement d'appeler un serveur)
const generateBezierCurve = (start, end) => {
  const points = [];
  
  // Point central de la droite
  const midLat = (start.latitude + end.latitude) / 2;
  const midLng = (start.longitude + end.longitude) / 2;

  // Calcul du vecteur perpendiculaire pour créer le "bombage" de la courbe
  const dLat = end.latitude - start.latitude;
  const dLng = end.longitude - start.longitude;
  
  // Coefficient de courbure (0.2 donne un bel arc doux)
  const curveFactor = 0.2; 
  const ctrlLat = midLat - (dLng * curveFactor); 
  const ctrlLng = midLng + (dLat * curveFactor);

  // Construction des 50 points de la courbe
  for (let t = 0; t <= 1; t += 0.02) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;

    const pLat = uu * start.latitude + 2 * u * t * ctrlLat + tt * end.latitude;
    const pLng = uu * start.longitude + 2 * u * t * ctrlLng + tt * end.longitude;
    
    points.push([pLat, pLng]);
  }
  return points;
};

const MapCard = forwardRef(({
  location,
  markers = [],
  route = null, // Contient maintenant {start, end}
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
        mapInstanceRef.current.flyTo([region.latitude, region.longitude], 15, { duration: 0.8 });
      }
    },
    fitToCoordinates: (coords) => {
      if (mapInstanceRef.current && coords.length > 0) {
        const bounds = L.latLngBounds(coords.map((c) => [c.latitude, c.longitude] || [c[0], c[1]]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], duration: 1 });
      }
    },
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

  const leafletKmlPositions = MAFERE_KML_ZONE.map(coord => [coord.latitude, coord.longitude]);

  // Calcul à la volée des points de l'arc si une route est demandée
  const arcPositions = useMemo(() => {
    if (route && route.start && route.end) {
      return generateBezierCurve(route.start, route.end);
    }
    return [];
  }, [route]);

  return (
    <View style={[styles.container, style]}>
      {/* 🚀 INJECTION DU CSS POUR L'ANIMATION DE FLUX DE LA LIGNE */}
      <style>{`
        .yely-golden-arc {
          stroke-dasharray: 8, 12;
          animation: arc-flow 1.5s linear infinite;
        }
        @keyframes arc-flow {
          to {
            stroke-dashoffset: -40;
          }
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
        ref={(mapInstance) => { if (mapInstance) mapInstanceRef.current = mapInstance; }}
        whenReady={() => onMapReady?.()}
      >
        <TileLayer url={darkMode ? DARK_TILE_URL : LIGHT_TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />

        <MapCenterUpdater location={location} hasRoute={!!route} />

        {leafletKmlPositions.length > 0 && (
          <Polygon 
            positions={leafletKmlPositions} 
            pathOptions={{
              color: THEME.COLORS.champagneGold,
              fillColor: THEME.COLORS.champagneGold,
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '5, 5'
            }} 
          />
        )}

        {showUserMarker && location && (
          <Marker position={[location.latitude, location.longitude]} icon={userIcon} />
        )}

        {markers.map((marker, index) => {
          const isDestination = marker.type === 'destination';
          return (
            <Marker 
              key={marker.id || `marker-${index}`} 
              position={[marker.latitude, marker.longitude]} 
              icon={isDestination ? destinationIcon : defaultIcon} 
              eventHandlers={{ click: () => onMarkerPress?.(marker) }} 
            />
          );
        })}

        {/* 🚀 RENDU DE L'ARC AU LIEU DE LA LIGNE CLASSIQUE */}
        {arcPositions.length > 0 && (
          <Polyline
            positions={arcPositions}
            pathOptions={{ 
              color: THEME.COLORS.champagneGold, 
              weight: 3, 
              className: 'yely-golden-arc' // Active l'animation CSS
            }}
          />
        )}
      </MapContainer>

      {showRecenterButton && (
        <TouchableOpacity
          style={styles.recenterButton}
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

MapCard.displayName = 'MapCard';

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', position: 'relative', borderBottomWidth: THEME.BORDERS.width.thin, borderBottomColor: THEME.COLORS.glassBorder },
  recenterButton: { position: 'absolute', bottom: THEME.SPACING.lg, right: THEME.SPACING.lg, width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.glassBorder, zIndex: 1000 },
});

export default MapCard;