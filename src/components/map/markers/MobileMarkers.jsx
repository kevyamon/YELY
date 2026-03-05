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

// ── Helper : premier mot uniquement ──
const getShortName = (text) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) return words[0] || '';
  return `${words[0]}…`;
};

// COMPOSANT ALLEGÉ : Plus d'animation ni de state de tooltip, que du visuel pur
export const PoiMarker = ({ coordinate, name, icon, color, onPress }) => {
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    setTracks(true);
    const timer = setTimeout(() => setTracks(false), 800);
    return () => clearTimeout(timer);
  }, [name, color, icon]);

  if (!coordinate?.latitude || !coordinate?.longitude) return null;

  const shortName = getShortName(name);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={40}
      tracksViewChanges={tracks}
      onPress={onPress}
    >
      <View style={styles.poiWrapper}>
        <View style={styles.poiBottom}>
          <View style={[styles.poiDot, { backgroundColor: color }]}>
            <Ionicons name={icon || 'location'} size={13} color="#FFFFFF" />
          </View>
          <Text
            style={[styles.poiShortText, { color: THEME.COLORS.textPrimary }]}
            numberOfLines={1}
          >
            {shortName}
          </Text>
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
  poiWrapper: {
    alignItems: 'center',
  },
  poiBottom: {
    alignItems: 'center',
  },
  poiDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  poiShortText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(12, 1, 1, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});