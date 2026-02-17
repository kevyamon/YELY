// src/screens/home/RiderHome.jsx
// HOME RIDER - Intégration Phase 5 (Estimation & Forfaits)

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import VehicleCarousel from '../../components/ride/VehicleCarousel'; // INTÉGRATION PHASE 5
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import { useLazyEstimateRideQuery } from '../../store/api/ridesApiSlice'; // INTÉGRATION API
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

// Données de secours (Fallback) au cas où le backend ne réponde pas encore
const MOCK_VEHICLES = [
  { id: '1', type: 'echo', name: 'Echo', duration: '5', estimatedPrice: 1000 },
  { id: '2', type: 'standard', name: 'Standard', duration: '3', estimatedPrice: 1500 },
  { id: '3', type: 'vip', name: 'VIP', duration: '8', estimatedPrice: 3000 }
];

const RiderHome = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  
  const { location, errorMsg } = useGeolocation(); 
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null); 
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  
  // PHASE 5 : Nouveaux états
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [estimateRide, { data: estimationData, isLoading: isEstimating, error: estimateError }] = useLazyEstimateRideQuery();
  
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (location) {
      const getAddress = async () => {
        try {
          const addr = await MapService.getAddressFromCoordinates(location.latitude, location.longitude);
          setCurrentAddress(addr);
        } catch (error) {
          setCurrentAddress(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
        }
      };
      getAddress();
    } else if (errorMsg) {
       setCurrentAddress("Signal GPS perdu");
    }
  }, [location, errorMsg]);

  // Définition des véhicules à afficher (API ou Mock pour ne jamais bloquer l'UX)
  const displayVehicles = estimationData?.vehicles || MOCK_VEHICLES;

  // Auto-sélection du véhicule Standard par défaut quand les forfaits s'affichent
  useEffect(() => {
    if (destination && displayVehicles?.length > 0 && !selectedVehicle) {
      const standardOption = displayVehicles.find(v => v.type === 'standard');
      setSelectedVehicle(standardOption || displayVehicles[0]);
    }
  }, [destination, displayVehicles, selectedVehicle]);

  const topPadding = insets.top + THEME.LAYOUT.HEADER_MAX_HEIGHT;

  const handleDestinationSelect = async (selectedPlace) => {
    setDestination(selectedPlace);
    setSelectedVehicle(null); // Réinitialisation du choix sur une nouvelle recherche
    
    if (location && mapRef.current) {
      // 1. Tracé GPS
      const coords = await MapService.getRouteCoordinates(location, selectedPlace);
      if (coords && coords.length > 0) {
        setRouteCoords(coords);
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 120, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }

      // 2. Appel au backend pour estimer le prix
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
    console.log("🚀 Lancement de la Phase 6 (Dispatch) pour :", selectedVehicle.name);
    // TODO Phase 6 : createRide mutation + socket
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
    <ScreenWrapper>
      
      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.name?.split(' ')[0] || "Passager"}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={() => setIsSearchModalVisible(true)}
      />

      <View style={[
        styles.mainContainer, 
        { paddingTop: topPadding, backgroundColor: THEME.COLORS.background }
      ]}>
        
        <View style={styles.mapSection}>
           {location ? (
             <MapCard 
               ref={mapRef}
               location={location}
               showUserMarker={true}
               darkMode={true}
               markers={mapMarkers}
               route={routeCoords ? { coordinates: routeCoords, color: THEME.COLORS.champagneGold, width: 4 } : null}
             />
           ) : (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
               <Text style={styles.loadingText}>Localisation en cours...</Text>
             </View>
           )}
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.forfaitsContainer}>
            <Text style={styles.sectionTitle}>NOS OFFRES</Text>
            
            {destination ? (
               <View style={styles.estimationWrapper}>
                 <VehicleCarousel 
                   vehicles={displayVehicles}
                   selectedVehicle={selectedVehicle}
                   onSelect={setSelectedVehicle}
                   isLoading={isEstimating && !estimationData}
                   error={estimateError}
                 />
                 
                 {/* BOUTON D'ACTION PRINCIPAL (CTA) */}
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
               <View style={styles.emptyCard}>
                 <Text style={styles.emptyCardText}>
                   Sélectionnez une destination
                 </Text>
               </View>
            )}
          </View>
        </View>

      </View>

      <DestinationSearchModal 
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onDestinationSelect={handleDestinationSelect}
      />

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  mapSection: {
    flex: 0.55, 
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: THEME.COLORS.surface, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark,
  },
  loadingText: {
    color: THEME.COLORS.textSecondary, 
    marginTop: 10, 
    fontSize: 12
  },
  bottomSection: {
    flex: 0.45, 
    backgroundColor: THEME.COLORS.background,
    paddingTop: THEME.SPACING.lg,
  },
  forfaitsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sectionTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
    letterSpacing: 2,
    marginLeft: THEME.SPACING.lg,
  },
  emptyCard: {
    width: '90%',
    height: 110,
    backgroundColor: THEME.COLORS.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  emptyCardText: {
    color: THEME.COLORS.textTertiary, 
    fontStyle: 'italic'
  },
  estimationWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: 16,
    width: '90%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
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