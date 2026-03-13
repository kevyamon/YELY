// src/components/map/markers/UserLocationMarker.jsx
// COMPOSANT MARQUEUR UTILISATEUR - Localisation Precise et Animee
// CSCSM Level: Bank Grade

import MapLibreGL from '@maplibre/maplibre-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import THEME from '../../../theme/theme';

const UserLocationMarker = ({ coordinate, identifier = "user_loc", visible = true }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (visible) {
      animation.start();
    } else {
      animation.stop();
      pulseAnim.setValue(0);
    }

    return () => animation.stop();
  }, [pulseAnim, visible]);

  if (!visible || !coordinate?.latitude || !coordinate?.longitude) return null;

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.6, 0.1, 0],
  });

  return (
    <MapLibreGL.MarkerView
      id={identifier}
      coordinate={[coordinate.longitude, coordinate.latitude]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.pulse,
            {
              transform: [{ scale }],
              opacity,
              backgroundColor: THEME.COLORS.champagneGold,
            },
          ]}
        />
        <View style={[styles.innerCircle, { backgroundColor: THEME.COLORS.champagneGold }]} />
      </View>
    </MapLibreGL.MarkerView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  innerCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default React.memo(UserLocationMarker);