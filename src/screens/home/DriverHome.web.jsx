// src/screens/home/DriverHome.web.jsx
// HOME DRIVER WEB - Synchronisation des Marqueurs et Arc Autonome
// CSCSM Level: Bank Grade

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import DriverRequestModal from '../../components/ride/DriverRequestModal';
import DriverRideOverlay from '../../components/ride/DriverRideOverlay';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import socketService from '../../services/socketService';
import { useUpdateAvailabilityMutation } from '../../store/api/usersApiSlice';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { selectCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const DriverHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const dispatch = useDispatch();
  
  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const { location, errorMsg } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const scrollY = useSharedValue(0);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();

  const isRideActive = currentRide && ['accepted', 'ongoing'].includes(currentRide.status);

  useEffect(() => {
    if (location && isAvailable) {
      socketService.emitLocation(location);
    }
  }, [location, isAvailable]);

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
      setCurrentAddress("Erreur GPS");
    }
  }, [location, errorMsg]);

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    try {
      const res = await updateAvailability({ isAvailable: newStatus }).unwrap();
      setIsAvailable(res.isAvailable);
      dispatch(updateUserInfo({ isAvailable: res.isAvailable }));
      
      if (res.isAvailable && location) {
        socketService.emitLocation(location);
      }
      
      dispatch(showSuccessToast({
        title: res.isAvailable ? "EN LIGNE" : "HORS LIGNE",
        message: res.isAvailable ? "Prêt pour les courses." : "À bientôt!",
      }));
    } catch (err) {
      dispatch(showErrorToast({ title: "Erreur", message: "Échec changement statut." }));
    }
  };

  // 🚀 ALIGNEMENT DES MARQUEURS WEB : Déclenche l'Arc Doré sur MapCard.web
  const mapMarkers = useMemo(() => {
    if (!isRideActive || !currentRide) return [];
    
    const isOngoing = currentRide.status === 'ongoing';
    const target = isOngoing ? currentRide.destination : currentRide.origin;
    
    const lat = target?.coordinates?.[1] || target?.latitude;
    const lng = target?.coordinates?.[0] || target?.longitude;

    if (lat && lng) {
      return [{
        id: 'destination', 
        latitude: Number(lat), 
        longitude: Number(lng),
        title: target.address || "Cible", 
        type: 'destination',
        iconType: isOngoing ? 'dropoff' : 'pickup' // Dit à la carte web d'afficher 🙋‍♂️ ou 🏁
      }];
    }
    return [];
  }, [isRideActive, currentRide]);

  return (
    <View style={styles.screenWrapper}>
      
      <View style={styles.mapContainer}>
         {location ? (
           <MapCard 
             ref={mapRef}
             location={location}
             showUserMarker={true}
             showRecenterButton={true} 
             darkMode={false} 
             floating={false} 
             markers={mapMarkers} // 🚀
             route={null} 
           />
         ) : (
           <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
             <Text style={styles.loadingText}>Localisation...</Text>
           </View>
         )}
      </View>

      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.name?.split(' ')[0] || "Chauffeur"}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {isRideActive ? (
        <DriverRideOverlay />
      ) : (
        <SmartFooter 
          isAvailable={isAvailable}
          onToggle={handleToggleAvailability}
          isToggling={isToggling}
        />
      )}

      <DriverRequestModal />

    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F5F5F5', zIndex: 1 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.glassDark },
  loadingText: { marginTop: 10, fontSize: 12, color: THEME.COLORS.textSecondary }
});

export default DriverHome;