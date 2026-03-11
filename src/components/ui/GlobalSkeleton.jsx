// src/components/ui/GlobalSkeleton.jsx
// SKELETON FANTOME - Architecture de Projection (Zero Calcul de Layout)
// CSCSM Level: Bank Grade

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import THEME from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. LA BRIQUE ATOMIQUE (L'OS)
// C'est ce composant que tu vas utiliser pour remplacer le texte/image dans tes vraies pages
export const SkeletonBone = ({ width, height, borderRadius = THEME.BORDERS.radius.sm, style }) => (
  <View style={[
    {
      width,
      height,
      borderRadius,
      backgroundColor: THEME.COLORS.border,
      opacity: 0.25,
    },
    style
  ]} />
);

// 2. LE PROJECTEUR DE LUMIERE
// Ce composant enveloppe ta page et projette l'animation par-dessus
const GlobalSkeleton = ({ visible, children, style }) => {
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      const shimmerAnim = Animated.loop(
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 1200,
          useNativeDriver: true,
        })
      );
      shimmerAnim.start();
      return () => shimmerAnim.stop();
    } else {
      translateX.setValue(-SCREEN_WIDTH);
    }
  }, [visible, translateX]);

  // Si on ne charge pas, on affiche simplement le contenu normal sans rien ajouter
  if (!visible) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, style]}>
      <View pointerEvents="none" style={styles.content}>
        {children}
      </View>
      
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ translateX }] },
          { zIndex: 10 }
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0.08)',
            'rgba(255, 255, 255, 0.25)',
            'rgba(255, 255, 255, 0.08)',
            'rgba(255, 255, 255, 0)'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  }
});

export default GlobalSkeleton;