// src/components/map/MapCard.web.jsx
// COMPOSANT CARTE WEB - Arc Doré Autonome, Tracé Dynamique & Driver Live Tracking
// CSCSM Level: Bank Grade

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

// Icone de prise en charge (bonhomme bleu pulse) - phase accepted
const pickupIcon = L.divIcon({
  className: 'yely-pickup-marker',
  html: `
    <div style="width: 50px; height: 50px; display: flex; justify-content: center; align-items: center; position: relative;">
      <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(52, 152, 219, 0.35); animation: yely-pulse 1.4s infinite ease-in-out;"></div>
      <div style="width: 34px; height: 34px; border-radius: 50%; background: #3498DB; border: 2px solid #FFFFFF; display: flex; justify-content: center; align-items: center; z-index: 1; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
        <span style="font-size: 18px;">🚶</span>
      </div>
      <style>
        @keyframes yely-pulse {
          0% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(0.8); opacity: 0.3; }
        }
      </style>
    </div>
  `,
  iconSize: [50, 50],
  iconAnchor: [25, 45],
});

// Icone de destination finale (drapeau rouge pulse) - phase ongoing
const destinationIcon = L.divIcon({
  className: 'yely-destination-marker',
  html: `
    <div style="width: 50px; height: 50px; display: flex; justify-content: center; align-items: center; position: relative;">
      <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(231, 76, 60, 0.35); animation: yely-dest-pulse 1.6s infinite ease-in-out;"></div>
      <span style="color: #E74C3C; font-size: 32px; z-index: 1; text-shadow: 0px 2px 4px rgba(0,0,0,0.5);">🏁</span>
      <style>
        @keyframes yely-dest-pulse {
          0% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(0.8); opacity: 0.3; }
        }
      </style>
    </div>
  `,
  iconSize: [50, 50],
  iconAnchor: [25, 45],
});

// Icone du point de rencontre deja passe (repere fixe dore) - phase ongoing chauffeur
const pickupOriginIcon = L.divIcon({
  className: 'yely-pickup-origin-marker',
  html: `
    <div style="width: 20px; height: 20px; border-radius: 50%; background: #D4AF37; border: 2px solid #FFFFFF; opacity: 0.7; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Icone du chauffeur (voiture doree animee)
const driverIcon = L.divIcon({
  className: 'yely-driver-marker',
  html: `
    <div style="width: 44px; height: 44px; display: flex; justify-content: center; align-items: center;">
      <div style="width: 36px; height: 36px; border-radius: 50%; background: #1E1E1E; border: 2px solid #D4AF37; display: flex; justify-content: center; align-items: center; box-shadow: 0px 4px 6px rgba(0,0,0,0.3);">
        <span style="color: #D4AF37; font-size: 18px;">🚙</span>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Genere une courbe de Bezier quadratique entre deux points.
// Utilise comme approximation visuelle du trace (pas de calcul OSRM sur le web).
// Le point de depart est toujours la position actuelle du conducteur/utilisateur.
const generateBezierCurve = (start, end) => {
  if (!start || !end) return [];
  const points = [];
  const midLat = (start.latitude + end.latitude) / 2;
  const midLng = (start.longitude + end.longitude) / 2;
  const dLat = end.latitude - start.latitude;
  const dLng = end.longitude - start.longitude;
  const curveFactor = 0.2;
  const ctrlLat = midLat - (dLng * curveFactor);
  const ctrlLng = midLng + (dLat * curveFactor);

  for (let t = 0; t <= 1; t += 0.02) {
    const u = 1 - t, tt = t * t, uu = u * u;
    const pLat = uu * start.latitude + 2 * u * t * ctrlLat + tt * end.latitude;
    const pLng = uu * start.longitude + 2 * u * t * ctrlLng + tt * end.longitude;
    points.push([pLat, pLng]);
  }
  return points;
};

// Composant interne qui recadre la carte sur les points pertinents.
// Adapte selon la phase : acceptee (chauffeur+pickup), ongoing (chauffeur+destination),
// ou apercu statique (user+destination).
const MapAutoFitter = ({ location, driverLocation, markers }) => {
  const map = useMap();

  useEffect(() => {
    const pickupMarker = markers.find((m) => m.type === 'pickup');
    const destMarker = markers.find((m) => m.type === 'destination');
    const activeTarget = pickupMarker || destMarker;

    // Phase accepted ou ongoing : cadrage chauffeur → cible active
    if (driverLocation?.latitude && activeTarget) {
      const bounds = L.latLngBounds([
        [driverLocation.latitude, driverLocation.longitude],
        [activeTarget.latitude, activeTarget.longitude],
      ]);
      setTimeout(() => {
        map.flyToBounds(bounds, {
          paddingTopLeft: [50, 150],
          paddingBottomRight: [50, 350],
          duration: 1.5,
          maxZoom: 16,
        });
      }, 300);
      return;
    }

    // Apercu destination (hors course) : cadrage user → destination
    if (location && activeTarget) {
      const bounds = L.latLngBounds([
        [location.latitude, location.longitude],
        [activeTarget.latitude, activeTarget.longitude],
      ]);
      setTimeout(() => {
        map.flyToBounds(bounds, {
          paddingTopLeft: [50, 150],
          paddingBottomRight: [50, 350],
          duration: 1.5,
          maxZoom: 16,
        });
      }, 300);
      return;
    }

    // Aucune cible : centrage sur l'utilisateur
    if (location) {
      map.flyTo([location.latitude, location.longitude], 15, { duration: 1 });
    }
  }, [location, driverLocation, markers, map]);

  return null;
};

const MapCard = forwardRef(({
  location,
  driverLocation,
  markers = [],
  route = null,
  showUserMarker = true,
  showRecenterButton = true,
  darkMode = true,
  onMapReady,
  onMarkerPress,
  style,
}, ref) => {
  const mapInstanceRef = useRef(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([region.latitude, region.longitude], 15, { duration: 0.8 });
      }
    },
    fitToCoordinates: () => {},
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

  // Calcul de l'arc dore (courbe de Bezier).
  // Logique de selection du point de depart :
  // 1. Route statique explicite (apercu avant course) → start fourni par le parent
  // 2. Chauffeur present + cible active → arc depuis le chauffeur (phase accepted/ongoing)
  // 3. Utilisateur seul + cible → arc depuis l'utilisateur (apercu rider)
  const arcPositions = useMemo(() => {
    if (route?.start && route?.end) {
      return generateBezierCurve(route.start, route.end);
    }

    const pickupMarker = markers.find((m) => m.type === 'pickup');
    const destMarker = markers.find((m) => m.type === 'destination');
    const activeTarget = pickupMarker || destMarker;

    if (!activeTarget) return [];

    // L'arc part toujours de la position actuelle du conducteur s'il est disponible,
    // sinon de la position de l'utilisateur (rider en attente).
    const arcOrigin = driverLocation?.latitude
      ? driverLocation
      : location;

    if (!arcOrigin) return [];

    return generateBezierCurve(arcOrigin, activeTarget);
  }, [route, location, driverLocation, markers]);

  return (
    <View style={[styles.container, style]}>
      <style>{`
        .yely-golden-arc { stroke-dasharray: 8, 12; animation: arc-flow 1.5s linear infinite; }
        @keyframes arc-flow { to { stroke-dashoffset: -40; } }
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
        <TileLayer
          url={darkMode ? DARK_TILE_URL : LIGHT_TILE_URL}
          attribution={ATTRIBUTION}
          maxZoom={19}
        />

        <MapAutoFitter location={location} driverLocation={driverLocation} markers={markers} />

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

        {showUserMarker && location && (
          <Marker position={[location.latitude, location.longitude]} icon={userIcon} />
        )}

        {driverLocation?.latitude && (
          <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={driverIcon} />
        )}

        {markers.map((marker, index) => {
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

        {arcPositions.length > 0 && (
          <Polyline
            positions={arcPositions}
            pathOptions={{
              color: THEME.COLORS.champagneGold,
              weight: 4,
              className: 'yely-golden-arc',
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
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    borderBottomWidth: THEME.BORDERS.width.thin,
    borderBottomColor: THEME.COLORS.glassBorder,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 300,
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