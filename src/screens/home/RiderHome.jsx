// src/screens/home/RiderHome.jsx
// HOME RIDER - Cadrage Caméra Centré & Équilibré
// CSCSM Level: Bank Grade

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import RiderWaitModal from '../../components/ride/RiderWaitModal';
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import { useLazyEstimateRideQuery, useRequestRideMutation } from '../../store/api/ridesApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { setCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

import { isLocationInMafereZone } from '../../utils/mafereZone';

const MOCK_VEHICLES = [
  { id: '1', type: 'echo', name: 'Echo', duration: '5' },
  { id: '2', type: 'standard', name: 'Standard', duration: '3' },
  { id: '3', type: 'vip', name: 'VIP', duration: '8' }
];

const RiderHome = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  
  const { location, errorMsg } = useGeolocation(); 
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null); 
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [estimateRide, { data: estimationData, isLoading: isEstimating, error: estimateError }] = useLazyEstimateRideQuery();
  
  const [requestRideApi, { isLoading: isOrdering }] = useRequestRideMutation();
  
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);

  const isUserInZone = isLocationInMafereZone(location);

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
    if (!isLocationInMafereZone(selectedPlace)) {
      dispatch(showErrorToast({ 
        title: 'Hors Zone', 
        message: 'Yély ne dessert que la ville de Maféré pour le moment.' 
      }));
      setIsSearchModalVisible(false);
      return;
    }

    setDestination(selectedPlace);
    setSelectedVehicle(null);
    
    if (location && mapRef.current) {
      const coords = await MapService.getRouteCoordinates(location, selectedPlace);
      
      if (coords && coords.length > 0) {
        const visualRoute = [
          { latitude: location.latitude, longitude: location.longitude },
          ...coords,
          { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude }
        ];

        setRouteCoords(visualRoute);
        
        // 🚀 CORRECTION UI : On a réduit le "bottom" et augmenté le reste.
        // La carte va donc "dézoomer" un peu plus et centrer le tracé proprement.
        mapRef.current.fitToCoordinates(visualRoute, {
          edgePadding: { top: 200, right: 80, bottom: 280, left: 80 },
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
    setDestination(null);
    setRouteCoords(null);
    setSelectedVehicle(null);
    
    if (location && mapRef.current) {
      mapRef.current.centerOnUser();
    }
  };

  const handleConfirmRide = async () => {
    if (!selectedVehicle || !location || !destination || !isUserInZone) return;
    
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
        message: error?.data?.message || 'Impossible de lancer la commande.' 
      }));
    }
  };

  const mapMarkers = useMemo(() => {
    if (!destination) return [];
    return [{
      id: 'destination', 
      latitude: destination.latitude, 
      longitude: destination.longitude,
      title: destination.address, 
      icon: 'flag', 
      iconColor: THEME.COLORS.danger,
      type: 'destination' 
    }];
  }, [destination]);

  const mapBottomPadding = destination ? 320 : 240; 

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
        isEstimating={isEstimating || isOrdering} 
        estimationData={estimationData}
        estimateError={estimateError}
        onConfirmRide={handleConfirmRide}
        isUserInZone={isUserInZone} 
      />

      <DestinationSearchModal 
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onDestinationSelect={handleDestinationSelect}
      />

      <RiderWaitModal />

    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.glassDark },
  loadingText: { color: THEME.COLORS.textSecondary, marginTop: 10, fontSize: 12 }
});

export default RiderHome;