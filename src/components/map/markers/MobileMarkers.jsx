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
    <MapLibreGL.MarkerView
      id={identifier || `marker-${coordinate.latitude}-${coordinate.longitude}`}
      coordinate={[parseFloat(coordinate.longitude), parseFloat(coordinate.latitude)]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.staticWrapper, { zIndex }]}>
        {children}
      </View>
    </MapLibreGL.MarkerView>
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
    <MapLibreGL.MarkerView
      id={identifier || 'animated-tracked-marker'}
      coordinate={[parseFloat(coordinate.longitude), parseFloat(coordinate.latitude)]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.staticWrapper, { zIndex }]}>
        {children}
      </View>
    </MapLibreGL.MarkerView>
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

// Refonte complète : Remplacement de la rotation par un design premium ultra-stable
export const SmoothDriverMarker = ({ coordinate }) => {
  if (!coordinate?.latitude || !coordinate?.longitude) return null;

  return (
    <MapLibreGL.MarkerView
      id="driver-marker"
      coordinate={[parseFloat(coordinate.longitude), parseFloat(coordinate.latitude)]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.staticWrapper, { zIndex: 200 }]}>
        <View style={styles.premiumDriverAura}>
          <View style={styles.premiumDriverCore}>
            <Ionicons
              name="car-sport"
              size={18}
              color={THEME.COLORS.champagneGold}
            />
          </View>
        </View>
      </View>
    </MapLibreGL.MarkerView>
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
    <MapLibreGL.MarkerView
      id={`poi-${coordinate.latitude}-${coordinate.longitude}`}
      coordinate={[parseFloat(coordinate.longitude), parseFloat(coordinate.latitude)]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.staticPoiWrapper}>
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
      </View>
    </MapLibreGL.MarkerView>
  );
};

const styles = StyleSheet.create({
  staticWrapper: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticPoiWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumDriverAura: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(212, 175, 55, 0.15)', // Aura champagne légère
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumDriverCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
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