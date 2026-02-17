// src/screens/home/RiderHome.jsx
// HOME RIDER - Fix Crash Annulation (centerOnUser)

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

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
  const user = useSelector(selectCurrentUser);
  
  const { location, errorMsg } = useGeolocation(); 
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null); 
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  
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
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 120, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }

      estimateRide({
        pickupLat: location.latitude, pickupLng: location.longitude,
        dropoffLat: selectedPlace.latitude, dropoffLng: selectedPlace.longitude
      });
    }
  };

  const handleCancelDestination = () => {
    // 1. On vide les états
    setDestination(null);
    setRouteCoords(null);
    setSelectedVehicle(null);
    
    // 2. CORRECTION : On utilise centerOnUser() qui est fait pour ça, au lieu de fitToCoordinates
    if (location && mapRef.current) {
      mapRef.current.centerOnUser();
    }
  };

  const handleConfirmRide = () => {
    if (!selectedVehicle) return;
    console.log("🚀 Lancement de la Phase 6 (Dispatch) pour :", selectedVehicle.name);
  };

  const mapMarkers = destination ? [{
    id: 'destination', latitude: destination.latitude, longitude: destination.longitude,
    title: destination.address, icon: 'flag', iconColor: THEME.COLORS.danger 
  }] : [];

  const mapBottomPadding = 240; 

  return (
    <View style={styles.screenWrapper}>
      
      <View style={styles.mapContainer}>
         {location ? (
           <MapCard 
             ref={mapRef}
             location={location}
             showUserMarker={true}
             showRecenterButton={true}
             floating={false}
             markers={mapMarkers}
             route={routeCoords ? { coordinates: routeCoords, color: THEME.COLORS.champagneGold, width: 4 } : null}
             recenterBottomPadding={mapBottomPadding} 
           />
         ) : (
           <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
             <Text style={styles.loadingText}>Localisation en cours...</Text>
           </View>
         )}
      </View>

      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.name?.split(' ')[0] || "Passager"}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={() => setIsSearchModalVisible(true)}
        hasDestination={!!destination}
        onCancelDestination={handleCancelDestination}
      />

      <SmartFooter 
        destination={destination}
        displayVehicles={displayVehicles}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
        isEstimating={isEstimating}
        estimationData={estimationData}
        estimateError={estimateError}
        onConfirmRide={handleConfirmRide}
      />

      <DestinationSearchModal 
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onDestinationSelect={handleDestinationSelect}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: THEME.COLORS.background, 
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark,
  },
  loadingText: {
    color: THEME.COLORS.textSecondary, 
    marginTop: 10, 
    fontSize: 12
  }
});

export default RiderHome;