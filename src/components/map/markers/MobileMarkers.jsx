// src/components/map/markers/MobileMarkers.jsx
// COMPOSANTS VISUELS CARTE MOBILE
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { AnimatedRegion, Marker } from 'react-native-maps';
import THEME from '../../../theme/theme';

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

export const AnimatedDestinationMarker = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5, duration: 1500,
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

export const SmoothDriverMarker = ({ coordinate, heading }) => {
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
      tracksViewChanges={tracks}
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

export const PoiMarker = ({ coordinate, name, icon, color, onPress }) => {
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    setTracks(true);
  }, [name, color, icon]);

  if (!coordinate?.latitude || !coordinate?.longitude) return null;

  return (
    <Marker
      coordinate={coordinate}
      // Ancrage calculé au millimètre pour une boîte de 160px et une icône de 20px
      // Le centre de l'icône est à (160 - 10) / 160 = 0.9375
      anchor={{ x: 0.9375, y: 0.5 }}
      zIndex={40}
      tracksViewChanges={tracks}
      onPress={onPress}
    >
      <View style={styles.poiContainer}>
        <Text 
          style={styles.poiText} 
          numberOfLines={1}
          onLayout={() => {
            setTimeout(() => setTracks(false), 800);
          }}
        >
          {name}
        </Text>
        
        <View style={[styles.poiIconCircle, { backgroundColor: `${color}20`, borderColor: color }]}>
          <Ionicons name={icon || 'location'} size={14} color={color} />
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
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
  poiContainer: {
    width: 160, // La Boîte de Sécurité
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Pousse texte et icône tout à droite
  },
  poiIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark,
    zIndex: 2,
    flexShrink: 0, // CRITIQUE : Interdit au texte long d'écraser l'icône
  },
  poiText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 6,
    textAlign: 'right', // Colle le texte contre l'icône
    flexShrink: 1, // Autorise le texte à se couper avec "..." s'il dépasse les 134px restants
    textShadowColor: THEME.COLORS.background,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    zIndex: 1,
  }
});