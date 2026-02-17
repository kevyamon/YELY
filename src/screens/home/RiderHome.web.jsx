// src/screens/home/RiderHome.web.jsx
// HOME RIDER WEB - Layout Web avec Logique Unifiée

import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import GlassCard from '../../components/ui/GlassCard';
import useGeolocation from '../../hooks/useGeolocation';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const RiderHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  
  const { location, address } = useGeolocation();
  const currentAddress = address || 'Localisation en cours...';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ═══════ ZONE HAUTE : Adresse + Menu ═══════ */}
      <View style={styles.topBar}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-sharp" size={16} color={THEME.COLORS.champagneGold} />
          <Text numberOfLines={1} style={styles.locationText}>{currentAddress}</Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Ionicons name="menu-outline" size={26} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>

      {/* ═══════ ZONE CENTRALE : La Carte (Aérée) ═══════ */}
      <View style={styles.mapWrapper}>
        {location ? (
          <MapCard
            ref={mapRef}
            location={location}
            showUserMarker
            showRecenterButton
            darkMode
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
          </View>
        )}
      </View>

      {/* ═══════ ZONE BASSE : Recherche & Offres ═══════ */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + THEME.SPACING.md }]}>

        <TouchableOpacity activeOpacity={0.8} onPress={() => console.log("Recherche...")}>
          <GlassCard style={styles.searchCard}>
            <View style={styles.searchRow}>
              <View style={styles.searchIconContainer}>
                <Ionicons name="search" size={20} color={THEME.COLORS.champagneGold} />
              </View>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchLabel}>Où allez-vous ?</Text>
                <Text style={styles.searchHint}>Saisissez votre destination</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={THEME.COLORS.textTertiary} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        <View style={styles.forfaitsPlaceholder}>
          <Text style={styles.sectionTitle}>NOS OFFRES</Text>
          <View style={styles.emptyBox}>
             <Text style={styles.emptyText}>Sélectionnez une destination</Text>
          </View>
          <View style={styles.forfaitDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.background,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassLight,
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.md,
    borderRadius: THEME.BORDERS.radius.lg,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    marginRight: THEME.SPACING.md,
  },
  locationText: {
    color: THEME.COLORS.textPrimary,
    marginLeft: THEME.SPACING.sm,
    fontSize: 12,
    flex: 1,
  },
  menuButton: {
    width: 46,
    height: 46,
    backgroundColor: THEME.COLORS.glassDark,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  mapWrapper: {
    flex: 1,
    marginTop: 20, // 🌟 AÉRATION
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.lg,
  },
  searchCard: {
    padding: 0,
    borderRadius: 16,
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchTextContainer: {
    flex: 1,
  },
  searchLabel: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchHint: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  forfaitsPlaceholder: {
    marginTop: 25,
    alignItems: 'center',
  },
  sectionTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 15,
    letterSpacing: 1,
  },
  emptyBox: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyText: {
    color: THEME.COLORS.textTertiary,
    fontStyle: 'italic',
    fontSize: 12,
  },
  forfaitDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.COLORS.glassBorder,
  },
  dotActive: {
    backgroundColor: THEME.COLORS.champagneGold,
    width: 18,
  },
});

export default RiderHome;