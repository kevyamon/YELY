// src/components/drawer/DrawerLogoutOverlay.jsx

import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { COLORS, FONTS, SPACING } from '../../theme/theme';

const DrawerLogoutOverlay = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={COLORS.champagneGold} />
        <Text style={styles.text}>Déconnexion...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 20, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  text: {
    color: COLORS.champagneGold,
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.semiBold,
    letterSpacing: 0.5,
  },
});

export default DrawerLogoutOverlay;