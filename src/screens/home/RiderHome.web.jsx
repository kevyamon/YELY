// src/screens/home/RiderHome.web.jsx
// HOME RIDER WEB - Phase 5 : Forfaits & Estimation

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import VehicleCarousel from '../../components/ride/VehicleCarousel';
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
import GlassCard from '../../components/ui/GlassCard';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import { useLazyEstimateRideQuery } from '../../store/api/ridesApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const MOCK_VEHICLES = [
  { id: '1', type: 'echo', name: 'Echo', duration: '5', estimatedPrice: 1000 },
  { id: '2', type: 'standard', name: 'Standard', duration: '3', estimatedPrice: 1500 },
  { id: '3', type: 'vip', name: 'VIP', duration: '8', estimatedPrice: 3000 }
];

const RiderHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  
  const { location, address } = useGeolocation();
  const currentAddress = address || 'Localisation en cours...';
  
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null); 
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [estimateRide, { data: estimationData, isLoading: isEstimating, error: estimateError }] = useLazyEstimateRideQuery();

  const displayVehicles = estimationData?.vehicles || MOCK_VEHICLES;

  useEffect(() => {
    if (destination && displayVehicles?.length > 0 && !selectedVehicle) {
      const standardOption = displayVehicles.find(v => v.type === 'standard');
      setSelectedVehicle(standardOption || displayVehicles[0]);
    }
  }, [destination, displayVehicles, selectedVehicle]);

  const handleDestinationSelect = async (selectedPlace) => {
    setDestination(selectedPlace);
    setSelectedVehicle(null);
    
    if (location && mapRef.current) {
      const coords = await MapService.getRouteCoordinates(location, selectedPlace);
      
      if (coords && coords.length > 0) {
        setRouteCoords(coords);
        mapRef.current.fitToCoordinates(coords); 
      }

      estimateRide({
        pickupLat: location.latitude,
        pickupLng: location.longitude,
        dropoffLat: selectedPlace.latitude,
        dropoffLng: selectedPlace.longitude
      });
    }
  };

  const handleConfirmRide = () => {
    if (!selectedVehicle) return;
    console.log("🚀 Lancement Web Phase 6 pour :", selectedVehicle.name);
  };

  const mapMarkers = destination ? [{
    id: 'destination',
    latitude: destination.latitude,
    longitude: destination.longitude,
    title: destination.address,
    icon: 'flag',
    iconColor: THEME.COLORS.danger
  }] : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

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

      <View style={styles.mapWrapper}>
        {location ? (
          <MapCard
            ref={mapRef}
            location={location}
            showUserMarker
            showRecenterButton
            darkMode
            markers={mapMarkers} 
            route={routeCoords ? { coordinates: routeCoords, color: THEME.COLORS.champagneGold, width: 4 } : null}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
          </View>
        )}
      </View>

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + THEME.SPACING.md }]}>

        {!destination && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setIsSearchModalVisible(true)}>
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
        )}

        <View style={[styles.forfaitsPlaceholder, destination && { marginTop: 0 }]}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>NOS OFFRES</Text>
            {destination && (
               <TouchableOpacity onPress={() => setIsSearchModalVisible(true)}>
                  <Text style={styles.editDestText}>Modifier dest.</Text>
               </TouchableOpacity>
            )}
          </View>
          
          {destination ? (
             <View style={styles.estimationWrapper}>
               <VehicleCarousel 
                 vehicles={displayVehicles}
                 selectedVehicle={selectedVehicle}
                 onSelect={setSelectedVehicle}
                 isLoading={isEstimating && !estimationData}
                 error={estimateError}
               />
               
               <TouchableOpacity 
                 style={[styles.confirmButton, !selectedVehicle && styles.confirmButtonDisabled]}
                 disabled={!selectedVehicle || isEstimating}
                 onPress={handleConfirmRide}
                 activeOpacity={0.9}
               >
                 <Text style={[styles.confirmButtonText, !selectedVehicle && styles.confirmButtonTextDisabled]}>
                   {selectedVehicle 
                      ? `Commander Yély ${selectedVehicle.name} • ${selectedVehicle.estimatedPrice} F`
                      : 'Sélectionnez un véhicule'}
                 </Text>
               </TouchableOpacity>
             </View>
          ) : (
             <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Sélectionnez une destination</Text>
             </View>
          )}
        </View>
      </View>

      <DestinationSearchModal 
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onDestinationSelect={handleDestinationSelect}
      />

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
    marginTop: 10, 
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  editDestText: {
    color: THEME.COLORS.champagneGold,
    fontSize: 12,
    fontWeight: 'bold',
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
  estimationWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: 16,
    width: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  confirmButtonDisabled: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
    borderWidth: 1,
  },
  confirmButtonText: {
    color: '#121418',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  confirmButtonTextDisabled: {
    color: THEME.COLORS.textTertiary,
  }
});

export default RiderHome;