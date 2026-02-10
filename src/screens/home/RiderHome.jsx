// src/screens/home/RiderHome.jsx

import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapCard from '../../components/map/MapCard';
import ScreenHeader from '../../components/ui/ScreenHeader';
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

  const availableHeight = SCREEN_HEIGHT - insets.top - 80 - insets.bottom;
  const mapHeight = availableHeight * 0.50;

  return (
    <View style={styles.container}>

      {/* ═══════ HEADER ═══════ */}
      <ScreenHeader
        leftIcon="radio-button-on"
        leftText={currentAddress}
        onRightPress={() => navigation.openDrawer()}
      />

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
  bottomSection: {
    flex: 1,
    backgroundColor: THEME.COLORS.deepAsphalt,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.lg,
  },
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