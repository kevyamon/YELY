// src/screens/home/RiderHome.jsx
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // Import normal ici
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import GlassCard from '../../components/ui/GlassCard';
import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import THEME from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const RiderHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const { location } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Localisation...');

  useEffect(() => {
    if (location) {
      const getAddress = async () => {
        const addr = await MapService.reverseGeocode(location.latitude, location.longitude);
        if (addr) setCurrentAddress(addr.shortName);
      };
      getAddress();
      
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, [location]);

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
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
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
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#F2F4F6" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.deepAsphalt },
  map: { width, height },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: 16, alignItems: 'center', zIndex: 10 },
  menuButton: { width: 50, height: 50, backgroundColor: THEME.COLORS.glassDark, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  locationBar: { flex: 1, marginLeft: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 50 },
  locationText: { color: THEME.COLORS.moonlightWhite, marginLeft: 10, fontSize: 14, flex: 1 },
  bottomSection: { position: 'absolute', bottom: 32, left: 20, right: 20 },
  searchCard: { padding: 16, borderRadius: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  searchText: { color: THEME.COLORS.textTertiary, fontSize: 18, fontWeight: '500' },
  userMarker: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(212, 175, 55, 0.2)', justifyContent: 'center', alignItems: 'center' },
  userMarkerInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: THEME.COLORS.champagneGold, borderWidth: 2, borderColor: '#FFF' }
});

export default RiderHome;