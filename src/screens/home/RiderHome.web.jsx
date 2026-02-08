// src/screens/home/RiderHome.web.jsx

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapCard from '../../components/map/MapCard';
import GlassCard from '../../components/ui/GlassCard';
import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import THEME from '../../theme/theme';

const RiderHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { location } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Localisation...');

  useEffect(() => {
    if (location) {
      const getAddress = async () => {
        const addr = await MapService.reverseGeocode(location.latitude, location.longitude);
        if (addr) setCurrentAddress(addr.shortName);
      };
      getAddress();
    }
  }, [location]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ═══════ ZONE HAUTE : Adresse + Hamburger ═══════ */}
      <View style={styles.topBar}>
        <View style={styles.locationContainer}>
          <Ionicons name="radio-button-on" size={16} color={THEME.COLORS.champagneGold} />
          <Text numberOfLines={1} style={styles.locationText}>{currentAddress}</Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu-outline" size={26} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>

      {/* ═══════ ZONE CENTRALE : La Carte ═══════ */}
      <MapCard
        ref={mapRef}
        location={location}
        showUserMarker
        showRecenterButton
        darkMode
      />

      {/* ═══════ ZONE BASSE : Recherche + Forfaits (futur) ═══════ */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + THEME.SPACING.md }]}>

        {/* Barre de recherche destination */}
        <TouchableOpacity activeOpacity={0.8}>
          <GlassCard style={styles.searchCard} withGlow>
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

        {/* Placeholder forfaits (Phase 5) */}
        <View style={styles.forfaitsPlaceholder}>
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
    backgroundColor: THEME.COLORS.deepAsphalt,
  },

  // ─── ZONE HAUTE ───
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.deepAsphalt,
    borderBottomWidth: THEME.BORDERS.width.thin,
    borderBottomColor: THEME.COLORS.glassBorder,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassLight,
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.md,
    borderRadius: THEME.BORDERS.radius.lg,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
    marginRight: THEME.SPACING.md,
  },
  locationText: {
    color: THEME.COLORS.moonlightWhite,
    marginLeft: THEME.SPACING.sm,
    fontSize: THEME.FONTS.sizes.bodySmall,
    flex: 1,
  },
  menuButton: {
    width: 46,
    height: 46,
    backgroundColor: THEME.COLORS.glassDark,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
  },

  // ─── ZONE BASSE ───
  bottomSection: {
    backgroundColor: THEME.COLORS.deepAsphalt,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.lg,
  },
  searchCard: {
    padding: 0,
    borderRadius: THEME.BORDERS.radius.xl,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.md,
    gap: THEME.SPACING.md,
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchTextContainer: {
    flex: 1,
  },
  searchLabel: {
    color: THEME.COLORS.moonlightWhite,
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.semiBold,
  },
  searchHint: {
    color: THEME.COLORS.textTertiary,
    fontSize: THEME.FONTS.sizes.caption,
    marginTop: THEME.SPACING.xxs,
  },

  // ─── FORFAITS PLACEHOLDER ───
  forfaitsPlaceholder: {
    paddingTop: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.sm,
    alignItems: 'center',
  },
  forfaitDots: {
    flexDirection: 'row',
    gap: THEME.SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.COLORS.textDisabled,
  },
  dotActive: {
    backgroundColor: THEME.COLORS.champagneGold,
    width: 18,
    borderRadius: 3,
  },
});

export default RiderHome;