// src/components/map/markers/MobileMarkers.jsx
// COMPOSANTS VISUELS CARTE MOBILE (MAPLIBRE)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import MapLibreGL from '@maplibre/maplibre-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../../theme/theme';

export const TrackedMarker = ({
  coordinate,
  children,
  zIndex,
  identifier,
  visible = true,
}) => {
  if (!visible || !coordinate?.latitude || !coordinate?.longitude) return null;

  return (
    <MapLibreGL.PointAnnotation
      id={identifier || `marker-${coordinate.latitude}-${coordinate.longitude}`}
      coordinate={[coordinate.longitude, coordinate.latitude]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={{ zIndex }}>
        {children}
      </View>
    </MapLibreGL.PointAnnotation>
  );
};

export const AnimatedTrackedMarker = ({
  coordinate,
  children,
  zIndex,
  identifier,
  visible = true,
}) => {
  if (!visible || !coordinate?.latitude || !coordinate?.longitude) return null;

  return (
    <MapLibreGL.PointAnnotation
      id={identifier || 'animated-tracked-marker'}
      coordinate={[coordinate.longitude, coordinate.latitude]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={{ zIndex }}>
        {children}
      </View>
    </MapLibreGL.PointAnnotation>
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
  if (!coordinate?.latitude || !coordinate?.longitude) return null;

  return (
    <MapLibreGL.PointAnnotation
      id="driver-marker"
      coordinate={[coordinate.longitude, coordinate.latitude]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={{ transform: [{ rotate: `${heading || 0}deg` }], zIndex: 200 }}>
        <Animated.View style={styles.carMarkerBg}>
          <Ionicons
            name="car-sport"
            size={20}
            color={THEME.COLORS.champagneGold}
          />
        </Animated.View>
      </View>
    </MapLibreGL.PointAnnotation>
  );
};

const getShortName = (text) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) return words[0] || '';
  return `${words[0]}...`;
};

export const PoiMarker = ({ coordinate, name, icon, color, onPress }) => {
  if (!coordinate?.latitude || !coordinate?.longitude) return null;

  const shortName = getShortName(name);

  return (
    <MapLibreGL.PointAnnotation
      id={`poi-${coordinate.latitude}-${coordinate.longitude}`}
      coordinate={[coordinate.longitude, coordinate.latitude]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <TouchableOpacity 
        activeOpacity={0.8} 
        style={styles.poiWrapper} 
        onPress={onPress}
      >
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
      </TouchableOpacity>
    </MapLibreGL.PointAnnotation>
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
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(12, 1, 1, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});