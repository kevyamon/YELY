// src/screens/home/RiderHome.jsx

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapCard from '../../components/map/MapCard';
import SearchBar from '../../components/ui/SearchBar';
import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import THEME from '../../theme/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  const topBarHeight = 70;
  const availableHeight = SCREEN_HEIGHT - insets.top - topBarHeight - insets.bottom;
  const mapHeight = availableHeight * 0.50;

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
      <View style={{ height: mapHeight }}>
        <MapCard
          ref={mapRef}
          location={location}
          showUserMarker
          showRecenterButton
          floating
          darkMode
        />
      </View>

      {/* ═══════ ZONE BASSE : Recherche + Forfaits (futur) ═══════ */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + THEME.SPACING.sm }]}>

        <SearchBar
          label="On va où ?"
          hint="Saisissez votre destination"
          onPress={() => {
            // Phase 4 : ouvrira le DestinationSearchSheet
            console.log('TODO: ouvrir recherche destination');
          }}
        />

        {/* Espace réservé pour les futures cartes forfaits (Phase 5) */}
        <View style={styles.forfaitsZone}>
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
    flex: 1,
    backgroundColor: THEME.COLORS.deepAsphalt,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.lg,
  },

  // ─── FORFAITS ZONE ───
  forfaitsZone: {
    flex: 1,
    justifyContent: 'center',
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