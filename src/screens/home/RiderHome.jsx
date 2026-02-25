// src/screens/home/RiderHome.jsx
// HOME RIDER MOBILE - Architecture de l'Arc Doré Balistique & Payload Blindé

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
  const [arcRoute, setArcRoute] = useState(null); 
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
      setArcRoute({
        start: { latitude: Number(location.latitude), longitude: Number(location.longitude) },
        end: { latitude: Number(selectedPlace.latitude), longitude: Number(selectedPlace.longitude) }
      });

      estimateRide({
        pickupLat: location.latitude, pickupLng: location.longitude,
        dropoffLat: selectedPlace.latitude, dropoffLng: selectedPlace.longitude
      });
    }
  };

  const handleCancelDestination = () => {
    setDestination(null);
    setArcRoute(null);
    setSelectedVehicle(null);
    
    if (location && mapRef.current) {
      mapRef.current.centerOnUser();
    }
  };

  const handleConfirmRide = async () => {
    // VACCIN ANTI-SILENCE : Alertes strictes pour chaque blocage
    if (!location) {
      dispatch(showErrorToast({ title: 'Erreur GPS', message: 'Position actuelle introuvable.' }));
      return;
    }
    if (!destination) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Veuillez choisir une destination.' }));
      return;
    }
    if (!selectedVehicle) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Veuillez sélectionner un forfait Yély.' }));
      return;
    }
    if (!isUserInZone) {
      dispatch(showErrorToast({ 
        title: 'Accès Refusé (Geofencing)', 
        message: 'Votre GPS indique que vous n\'êtes pas à Maféré. (Placez votre Fake GPS sur Maféré pour tester).' 
      }));
      return;
    }
    
    try {
      // SÉCURITÉ ABSOLUE : Typage strict avant de parler à Zod
      const origLng = Number(location.longitude || location.lng || 0);
      const origLat = Number(location.latitude || location.lat || 0);
      const destLng = Number(destination.longitude || destination.lng || 0);
      const destLat = Number(destination.latitude || destination.lat || 0);

      let safeOriginAddress = String(currentAddress || "Position actuelle").trim();
      if (safeOriginAddress.length < 5) safeOriginAddress += " (Départ)";
      if (safeOriginAddress.length > 190) safeOriginAddress = safeOriginAddress.substring(0, 190);

      let safeDestAddress = String(destination.address || destination.name || "Destination").trim();
      if (safeDestAddress.length < 5) safeDestAddress += " (Arrivée)";
      if (safeDestAddress.length > 190) safeDestAddress = safeDestAddress.substring(0, 190);

      const payload = {
        origin: {
          address: safeOriginAddress,
          coordinates: [origLng, origLat]
        },
        destination: {
          address: safeDestAddress,
          coordinates: [destLng, destLat]
        },
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
        title: 'Détail de l\'erreur API', 
        message: errorMessage
      }));
    }
  };

  const mapMarkers = useMemo(() => {
    if (!destination) return [];
    return [{
      id: 'destination', 
      latitude: Number(destination.latitude), 
      longitude: Number(destination.longitude),
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
             route={arcRoute}
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