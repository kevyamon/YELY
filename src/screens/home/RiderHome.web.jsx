// src/screens/home/RiderHome.web.jsx
// HOME RIDER WEB - Modale d'attente branchée !

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import RiderBottomPanel from '../../components/ride/RiderBottomPanel';
import RiderWaitModal from '../../components/ride/RiderWaitModal'; // 🚀 NOUVEAU
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
import GlassCard from '../../components/ui/GlassCard';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import { useLazyEstimateRideQuery, useRequestRideMutation } from '../../store/api/ridesApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { setCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const MOCK_VEHICLES = [
  { id: '1', type: 'echo', name: 'Echo', duration: '5' },
  { id: '2', type: 'standard', name: 'Standard', duration: '3' },
  { id: '3', type: 'vip', name: 'VIP', duration: '8' }
];

const RiderHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  
  const { location, address } = useGeolocation();
  const currentAddress = address || 'Localisation en cours...';
  
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null); 
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [estimateRide, { data: estimationData, isLoading: isEstimating, error: estimateError }] = useLazyEstimateRideQuery();

  const [requestRideApi, { isLoading: isOrdering }] = useRequestRideMutation();

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
        pickupLat: location.latitude, pickupLng: location.longitude,
        dropoffLat: selectedPlace.latitude, dropoffLng: selectedPlace.longitude
      });
    }
  };

  const handleCancelDestination = () => {
    setDestination(null);
    setRouteCoords(null);
    setSelectedVehicle(null);
    
    if (location && mapRef.current) {
      mapRef.current.centerOnUser();
    }
  };

  const handleConfirmRide = async () => {
    if (!selectedVehicle || !location || !destination) return;
    
    try {
      const payload = {
        origin: {
          address: currentAddress || "Position actuelle",
          coordinates: [location.longitude, location.latitude]
        },
        destination: {
          address: destination.address || "Destination",
          coordinates: [destination.longitude, destination.latitude]
        },
        forfait: selectedVehicle.type?.toUpperCase() || 'STANDARD'
      };
      
      const res = await requestRideApi(payload).unwrap();
      const rideData = res.data || res; 
      
      dispatch(setCurrentRide({
        rideId: rideData.rideId,
        status: rideData.status || 'searching',
        origin: payload.origin.address,
        destination: payload.destination.address,
        forfait: payload.forfait
      }));
      
    } catch (error) {
      dispatch(showErrorToast({ 
        title: 'Erreur', 
        message: error?.data?.message || 'Impossible de lancer la commande sur le Web.' 
      }));
    }
  };

  const mapMarkers = destination ? [{
    id: 'destination', latitude: destination.latitude, longitude: destination.longitude,
    title: destination.address, icon: 'flag', iconColor: THEME.COLORS.danger
  }] : [];

  const renderWebSearchControls = () => {
    if (!destination) {
      return (
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
      );
    }

    return (
      <TouchableOpacity style={styles.cancelCard} activeOpacity={0.8} onPress={handleCancelDestination}>
         <Ionicons name="close-circle" size={20} color={THEME.COLORS.danger} />
         <Text style={styles.cancelCardText}>Annuler la destination</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.mapWrapper}>
        {location ? (
          <MapCard
            ref={mapRef}
            location={location}
            showUserMarker showRecenterButton 
            floating={false}
            markers={mapMarkers} 
            route={routeCoords ? { coordinates: routeCoords, color: THEME.COLORS.champagneGold, width: 4 } : null}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
          </View>
        )}
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-sharp" size={16} color={THEME.COLORS.champagneGold} />
          <Text numberOfLines={1} style={styles.locationText}>{currentAddress}</Text>
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')}>
          <Ionicons name="menu-outline" size={26} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>

      <RiderBottomPanel 
        destination={destination}
        displayVehicles={displayVehicles}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
        isEstimating={isEstimating}
        estimationData={estimationData}
        estimateError={estimateError}
        onConfirmRide={handleConfirmRide}
        isOrdering={isOrdering} 
        topContent={renderWebSearchControls()} 
      />

      <DestinationSearchModal 
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onDestinationSelect={handleDestinationSelect}
      />

      {/* 🚀 L'ÉCRAN GÉANT EST ENFIN PLACÉ ICI ! */}
      <RiderWaitModal />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: THEME.COLORS.background,
  },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F5',
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.background,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    zIndex: 10,
    borderWidth: 2.5,
    borderTopWidth: 0, 
    borderColor: THEME.COLORS.champagneGold, 
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 15,
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
  cancelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderColor: THEME.COLORS.danger,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  cancelCardText: {
    color: THEME.COLORS.danger,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  }
});

export default RiderHome;