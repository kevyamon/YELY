import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import GlassCard from '../../components/ui/GlassCard';
import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import THEME from '../../theme/theme';

// 1. IMPORT CONDITIONNEL DES CARTES
// Cela empêche le crash au démarrage sur le Web
let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const { width, height } = Dimensions.get('window');

const RiderHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const { location, error: geoError, isLoading: geoLoading } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Chargement de votre position...');

  useEffect(() => {
    if (location) {
      const getAddress = async () => {
        const addr = await MapService.reverseGeocode(location.latitude, location.longitude);
        if (addr) setCurrentAddress(addr.shortName);
      };
      getAddress();
      
      if (Platform.OS !== 'web') {
        mapRef.current?.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      }
    }
  }, [location]);

  // Rendu alternatif pour le Web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webPlaceholder}>
          <Ionicons name="map-outline" size={64} color={THEME.COLORS.champagneGold} />
          <Text style={styles.webText}>
            La carte n'est disponible que sur l'application mobile (iOS / Android).
          </Text>
          <Text style={styles.webSubText}>
            Veuillez utiliser un émulateur ou votre téléphone physique.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={mapStyle}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Vous êtes ici"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu-outline" size={28} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
        
        <GlassCard style={styles.locationBar}>
          <Ionicons name="radio-button-on" size={18} color={THEME.COLORS.champagneGold} />
          <Text numberOfLines={1} style={styles.locationText}>{currentAddress}</Text>
        </GlassCard>
      </SafeAreaView>

      <View style={styles.bottomSection}>
        <TouchableOpacity activeOpacity={0.9}>
          <GlassCard style={styles.searchCard}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={22} color={THEME.COLORS.textTertiary} />
              <Text style={styles.searchText}>Où allez-vous ?</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#121418" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#F2F4F6" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#484848" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.deepAsphalt },
  map: { width, height },
  webPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  webText: { color: THEME.COLORS.moonlightWhite, textAlign: 'center', fontSize: 18, marginTop: 20 },
  webSubText: { color: THEME.COLORS.textSecondary, textAlign: 'center', marginTop: 10 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: THEME.SPACING.lg,
    alignItems: 'center',
    zIndex: 10,
  },
  menuButton: {
    width: 50,
    height: 50,
    backgroundColor: THEME.COLORS.glassDark,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
  },
  locationBar: {
    flex: 1,
    marginLeft: THEME.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.md,
    height: 50,
  },
  locationText: { color: THEME.COLORS.moonlightWhite, marginLeft: 10, fontSize: 14, flex: 1 },
  bottomSection: {
    position: 'absolute',
    bottom: THEME.SPACING.xxl,
    left: THEME.SPACING.xl,
    right: THEME.SPACING.xl,
  },
  searchCard: { padding: THEME.SPACING.lg, borderRadius: THEME.BORDERS.radius.xl },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  searchText: { color: THEME.COLORS.textTertiary, fontSize: 18, fontWeight: '500' },
  userMarker: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(212, 175, 55, 0.2)', justifyContent: 'center', alignItems: 'center' },
  userMarkerInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: THEME.COLORS.champagneGold, borderWidth: 2, borderColor: '#FFF' }
});

export default RiderHome;