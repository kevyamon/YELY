import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import RatingModal from '../../components/ride/RatingModal';
import RiderRideOverlay from '../../components/ride/RiderRideOverlay';
import RiderWaitModal from '../../components/ride/RiderWaitModal';
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import socketService from '../../services/socketService';
import {
  useLazyEstimateRideQuery,
  useRequestRideMutation
} from '../../store/api/ridesApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { clearCurrentRide, selectCurrentRide, setCurrentRide, setRideToRate } from '../../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
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
  const currentRide = useSelector(selectCurrentRide);
  
  const { location, errorMsg } = useGeolocation(); 
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const [destination, setDestination] = useState(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [estimateRide, { data: estimationData, isLoading: isEstimating, error: estimateError }] = useLazyEstimateRideQuery();
  
  const [requestRideApi, { isLoading: isOrdering }] = useRequestRideMutation();
  
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);

  const isUserInZone = isLocationInMafereZone(location);
  const isRideActive = currentRide && ['accepted', 'ongoing'].includes(currentRide.status);

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

  // --- ECOUTE DU SIGNAL DE FIN DE COURSE (BACKEND) ---
  useEffect(() => {
    const handleRideCompleted = (data) => {
      dispatch(setRideToRate(data));
      dispatch(clearCurrentRide());
      setDestination(null);
      setSelectedVehicle(null);
      
      dispatch(showSuccessToast({
        title: 'Course terminee',
        message: 'Vous etes arrive a destination.'
      }));

      if (mapRef.current) {
        mapRef.current.centerOnUser();
      }
    };

    socketService.on('ride_completed', handleRideCompleted);
    return () => {
      socketService.off('ride_completed', handleRideCompleted);
    };
  }, [dispatch]);

  const handleDestinationSelect = async (selectedPlace) => {
    if (!isLocationInMafereZone(selectedPlace)) {
      dispatch(showErrorToast({ 
        title: 'Hors Zone', 
        message: 'Yely ne dessert que la ville de Mafere pour le moment.' 
      }));
      setIsSearchModalVisible(false);
      return;
    }

    setDestination(selectedPlace);
    setSelectedVehicle(null);
    
    if (location && mapRef.current) {
      estimateRide({
        pickupLat: location.latitude, pickupLng: location.longitude,
        dropoffLat: selectedPlace.latitude, dropoffLng: selectedPlace.longitude
      });
    }
  };

  const handleCancelDestination = () => {
    setDestination(null);
    setSelectedVehicle(null);
    
    if (location && mapRef.current) {
      mapRef.current.centerOnUser();
    }
  };

  const handleConfirmRide = async () => {
    if (!location) {
      dispatch(showErrorToast({ title: 'Erreur GPS', message: 'Localisation introuvable. Activez votre GPS.' }));
      return;
    }
    if (!isUserInZone) {
      dispatch(showErrorToast({ title: 'Hors Zone', message: 'Vous devez etre dans la zone de Mafere pour commander.' }));
      return;
    }
    if (!destination) {
      dispatch(showErrorToast({ title: 'Destination', message: 'Veuillez choisir une destination.' }));
      return;
    }
    if (!selectedVehicle) {
      dispatch(showErrorToast({ title: 'Vehicule', message: 'Veuillez selectionner un type de vehicule.' }));
      return;
    }
    
    try {
      const origLng = Number(location.longitude || location.lng || 0);
      const origLat = Number(location.latitude || location.lat || 0);
      const destLng = Number(destination.longitude || destination.lng || 0);
      const destLat = Number(destination.latitude || destination.lat || 0);

      let safeOriginAddress = String(currentAddress || "Position actuelle").trim();
      if (safeOriginAddress.length < 5) safeOriginAddress += " (Depart)";
      if (safeOriginAddress.length > 190) safeOriginAddress = safeOriginAddress.substring(0, 190);

      let safeDestAddress = String(destination.address || destination.name || "Destination").trim();
      if (safeDestAddress.length < 5) safeDestAddress += " (Arrivee)";
      if (safeDestAddress.length > 190) safeDestAddress = safeDestAddress.substring(0, 190);

      const payload = {
        origin: { address: safeOriginAddress, coordinates: [origLng, origLat] },
        destination: { address: safeDestAddress, coordinates: [destLng, destLat] },
        forfait: String(selectedVehicle.type || 'STANDARD').toUpperCase()
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
      const errorData = error?.data;
      let errorMessage = errorData?.message || 'Impossible de lancer la commande.';
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.map(e => `${e.field} : ${e.message}`).join('\n');
      } else if (error?.error) {
         errorMessage = error.error; 
      }

      dispatch(showErrorToast({ 
        title: 'Information', 
        message: errorMessage
      }));
    }
  };

  const mapMarkers = useMemo(() => {
    if (isRideActive && currentRide) {
      const isOngoing = currentRide.status === 'ongoing';

      if (isOngoing) {
        const destLat = currentRide.destination?.coordinates?.[1] || currentRide.destination?.latitude;
        const destLng = currentRide.destination?.coordinates?.[0] || currentRide.destination?.longitude;
        if (!destLat || !destLng) return [];
        return [{
          id: 'destination',
          type: 'destination',
          latitude: Number(destLat),
          longitude: Number(destLng),
          title: currentRide.destination?.address || 'Destination',
          iconColor: THEME.COLORS.danger,
        }];
      }

      const originLat = currentRide.origin?.coordinates?.[1] || currentRide.origin?.latitude;
      const originLng = currentRide.origin?.coordinates?.[0] || currentRide.origin?.longitude;
      if (!originLat || !originLng) return [];
      return [{
        id: 'pickup',
        type: 'pickup',
        latitude: Number(originLat),
        longitude: Number(originLng),
        title: currentRide.origin?.address || 'Point de rencontre',
        iconColor: THEME.COLORS.info,
      }];
    }

    if (!destination) return [];
    return [{
      id: 'destination',
      latitude: Number(destination.latitude),
      longitude: Number(destination.longitude),
      title: destination.address,
      iconColor: THEME.COLORS.danger,
      type: 'destination'
    }];
  }, [destination, isRideActive, currentRide]);

  const mapBottomPadding = isRideActive ? 280 : (destination ? 320 : 240);

  const driverLocationObj = currentRide?.driverLocation;
  const driverLatLng = driverLocationObj
    ? {
        latitude: driverLocationObj?.coordinates?.[1] ?? driverLocationObj?.latitude,
        longitude: driverLocationObj?.coordinates?.[0] ?? driverLocationObj?.longitude,
        heading: driverLocationObj?.heading,
      }
    : null;

  const mapTraceOrigin = (isRideActive && driverLatLng?.latitude) ? driverLatLng : location;

  return (
    <View style={styles.screenWrapper}>
      
      <View style={styles.mapContainer}>
         {location ? (
           <MapCard 
             ref={mapRef}
             location={mapTraceOrigin}
             driverLocation={isRideActive ? driverLatLng : null}
             showUserMarker={!isRideActive}
             showRecenterButton={true}
             floating={false}
             markers={mapMarkers}
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
        hasDestination={!!destination && !isRideActive} 
        onCancelDestination={handleCancelDestination}
      />

      {isRideActive ? (
        <RiderRideOverlay />
      ) : (
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
      )}

      <DestinationSearchModal 
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onDestinationSelect={handleDestinationSelect}
      />

      <RiderWaitModal />
      <RatingModal />

    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.glassDark },
  loadingText: { color: THEME.COLORS.textSecondary, marginTop: 10, fontSize: 12 },
});

export default RiderHome;