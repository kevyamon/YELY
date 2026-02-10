// src/components/drawer/DrawerFooter.jsx

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { BORDERS, COLORS, FONTS, SPACING } from '../../theme/theme';

const DrawerFooter = ({ onLogout, isLoggingOut, paddingBottom }) => {
  return (
    <View style={[styles.container, { paddingBottom }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={isLoggingOut}
        style={[
          styles.logoutButton,
          isLoggingOut && styles.logoutButtonDisabled,
        ]}
        onPress={onLogout}
      >
        {isLoggingOut ? (
          <ActivityIndicator size={20} color={COLORS.danger} />
        ) : (
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        )}
        <Text style={styles.logoutText}>
          {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Yély v1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDERS.radius.lg,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    borderWidth: BORDERS.width.thin,
    borderColor: 'rgba(231, 76, 60, 0.15)',
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: FONTS.sizes.bodySmall,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.md,
  },
  versionText: {
    color: COLORS.textDisabled,
    fontSize: FONTS.sizes.micro,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});

export default DrawerFooter;