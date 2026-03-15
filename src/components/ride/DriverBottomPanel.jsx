// src/components/ride/DriverBottomPanel.jsx
// COMPOSANT CHAUFFEUR - Panneau de controle fixe (Always Online)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';

const DriverBottomPanel = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.bottomPanel, 
      { paddingBottom: Math.max(insets.bottom + 20, THEME.SPACING.xl) }
    ]}>
      
      <View style={styles.availabilityCardOnline}>
        <View style={styles.availabilityRow}>
          <View style={styles.statusInfo}>
            <View style={styles.statusHeader}>
              <Ionicons name="radio-button-on" size={18} color={THEME.COLORS.success} />
              <Text style={styles.statusTitle}>EN SERVICE</Text>
            </View>
            <Text style={styles.statusSubtitle}>
              Recherche active de passagers a proximite...
            </Text>
          </View>
          
          {/* Un petit radar visuel statique pour remplacer le vieux bouton */}
          <Ionicons name="wifi" size={24} color={THEME.COLORS.success} style={{ opacity: 0.8 }} />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <StatBox icon="car-sport" value="0" label="Courses" />
        <StatBox icon="time" value="0h" label="Heures" />
        <StatBox icon="wallet" value="0 F" label="Gains" isGold />
      </View>

    </View>
  );
};

const StatBox = ({ icon, value, label, isGold }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={22} color={isGold ? THEME.COLORS.champagneGold : THEME.COLORS.textSecondary} />
    <Text style={[styles.statValue, isGold && { color: THEME.COLORS.champagneGold }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.COLORS.background,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.xl,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  availabilityCardOnline: {
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    borderColor: 'rgba(46, 204, 113, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  statusTitle: {
    color: THEME.COLORS.success,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  statusSubtitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
    borderWidth: 1,
  },
  statValue: {
    color: THEME.COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    color: THEME.COLORS.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
  }
});

export default DriverBottomPanel;