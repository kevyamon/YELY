// src/components/map/markers/MobileMarkers.jsx
// COMPOSANTS VISUELS CARTE MOBILE - Icônes autonomes sans conteneur
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { AnimatedRegion, Marker } from 'react-native-maps';
import THEME from '../../../theme/theme';

// ─── TRACKED MARKER ──────────────────────────────────────────────
export const TrackedMarker = ({
  coordinate,
  anchor,
  children,
  zIndex,
  identifier,
  visible = true,
}) => {
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    // On garde 1000ms pour s'assurer que les ombres ont le temps de charger sur Samsung
    const timer = setTimeout(() => setTracks(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <Marker
      identifier={identifier}
      coordinate={coordinate}
      anchor={anchor}
      tracksViewChanges={tracks}
      zIndex={zIndex}
    >
      {children}
    </Marker>
  );
};

// ─── PICKUP MARKER (Passager) ────────────────────────────────────
export const AnimatedPickupMarker = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1, duration: 1200,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0, duration: 1200,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1], outputRange: [0.85, 1.15],
  });
  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1], outputRange: [0.4, 0.8, 0.4],
  });

  return (
    <Animated.View
      style={[
        styles.humanMarkerBg,
        {
          backgroundColor: color,
          transform: [{ scale }],
          opacity: opacity.interpolate({
            inputRange: [0.4, 0.8],
            outputRange: [0.85, 1],
            extrapolate: 'clamp',
          }),
        },
      ]}
    >
      <Ionicons name="accessibility" size={24} color="#FFFFFF" />
    </Animated.View>
  );
};

// ─── DESTINATION MARKER (Drapeau) ────────────────────────────────
export const AnimatedDestinationMarker = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1, duration: 1500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0, duration: 1500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1], outputRange: [0.9, 1.1],
  });

  return (
    <Animated.View
      style={[
        styles.flagMarkerBg,
        {
          backgroundColor: color,
          transform: [{ scale }],
        },
      ]}
    >
      <Ionicons name="flag" size={22} color="#FFFFFF" />
    </Animated.View>
  );
};

// ─── DRIVER MARKER (Voiture animée) ─────────────────────────────
export const SmoothDriverMarker = ({ coordinate, heading }) => {
  // REPARATION ANDROID : Le bouclier anti-lag
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracks(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const [markerCoordinate] = useState(
    new AnimatedRegion({
      latitude: coordinate?.latitude || 0,
      longitude: coordinate?.longitude || 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  );

  // EXTRACTION DES CHIFFRES : C'est le secret pour débloquer le chauffeur
  const lat = coordinate?.latitude;
  const lng = coordinate?.longitude;

  useEffect(() => {
    if (lat && lng) {
      markerCoordinate.timing({
        latitude: lat,
        longitude: lng,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [lat, lng, markerCoordinate]);

  return (
    <Marker.Animated
      coordinate={markerCoordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={200}
      flat={true}
      rotation={heading || 0}
      tracksViewChanges={tracks} // <-- Application du bouclier
    >
      <Animated.View style={styles.carMarkerBg}>
        <Ionicons
          name="car-sport"
          size={20}
          color={THEME.COLORS.champagneGold}
        />
      </Animated.View>
    </Marker.Animated>
  );
};

// ─── STYLES - TOUT AUTONOME, ZÉRO CONTENEUR WRAPPER ─────────────
const styles = StyleSheet.create({
  // Passager — le rond EST le marqueur, pas de parent
  humanMarkerBg: {
    width: 35,
    height: 35,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },

  // Drapeau — le rond EST le marqueur
  flagMarkerBg: {
    width: 35,
    height: 35,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },

  // Voiture — le rond EST le marqueur
  carMarkerBg: {
    width: 35,
    height: 35,
    borderRadius: 19,
    backgroundColor: '#1E1E1E',
    borderWidth: 2.5,
    borderColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});