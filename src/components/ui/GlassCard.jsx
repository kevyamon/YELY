// src/components/ui/GlassCard.jsx
// Carte avec effet Glassmorphism - utilisée partout

import { StyleSheet, View } from 'react-native';
import { BORDERS, COLORS, SHADOWS, SPACING } from '../../theme/theme';

const GlassCard = ({
  children,
  style,
  intensity = 'medium', // 'light', 'medium', 'dark'
  withBorder = true,
  withGlow = false,
  borderRadius = BORDERS.radius.xl,
  padding = SPACING.xl,
}) => {
  const getBackgroundColor = () => {
    switch (intensity) {
      // Toutes ces variantes pointent maintenant vers ta surface dynamique (Blanc ou Noir vitré)
      case 'light': return COLORS.glassSurface; 
      case 'dark': return COLORS.glassSurface;
      default: return COLORS.glassSurface;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          backgroundColor: getBackgroundColor(),
        },
        withBorder && {
          borderWidth: BORDERS.width.thin, // Ou BORDERS.width.normal si tu veux plus épais
          borderColor: COLORS.border,      // C'est ça qui te donne le contour gris visible
        },
        withGlow && {
          borderColor: COLORS.borderActive, // Le contour OR
          ...SHADOWS.goldSoft,
        },
        style,
      ]}
    >
      <View style={[styles.content, { padding }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    ...SHADOWS.medium, // L'ombre aide aussi à détacher la carte du fond blanc
  },
  content: {
    flex: 1,
  },
});

export default GlassCard;