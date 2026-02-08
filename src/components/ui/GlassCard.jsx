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
      case 'light': return COLORS.glassUltraLight;
      case 'dark': return COLORS.glassDark;
      default: return COLORS.glassMedium;
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
        withBorder && styles.border,
        withGlow && {
          borderColor: COLORS.glassBorderActive,
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
    ...SHADOWS.medium,
  },
  border: {
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
  },
  content: {
    flex: 1,
  },
});

export default GlassCard;