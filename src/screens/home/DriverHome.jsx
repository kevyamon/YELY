// src/screens/home/DriverHome.jsx
// HOME DRIVER - Auto-Online, Geofencing & Transition Automatique
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
import { useStartRideMutation } from '../../store/api/ridesApiSlice';
import { useUpdateAvailabilityMutation } from '../../store/api/usersApiSlice';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { selectCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

import { isLocationInMafereZone } from '../../utils/mafereZone';

const DriverHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const hasAutoConnected = useRef(false); 
  const hasAutoStartedRef = useRef(false);
  const dispatch = useDispatch();
  
  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const { location, errorMsg } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const scrollY = useSharedValue(0);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();
  const [startRide] = useStartRideMutation();

  const isDriverInZone = isLocationInMafereZone(location);
  const isRideActive = currentRide && ['accepted', 'ongoing'].includes(currentRide.status);

  useEffect(() => {
    if (user?.isAvailable !== undefined) {
      setIsAvailable(user.isAvailable);
    }
  }, [user?.isAvailable]);

  // AUTO-CONNECT LOGIC
  useEffect(() => {
    const processAutoConnect = async () => {
      if (!hasAutoConnected.current && location && !isAvailable) {
        hasAutoConnected.current = true; 

        if (isDriverInZone) {
          try {
            const res = await updateAvailability({ isAvailable: true }).unwrap();
            const actualStatus = res.data ? res.data.isAvailable : true;
            
            setIsAvailable(actualStatus);
            dispatch(updateUserInfo({ isAvailable: actualStatus }));
            socketService.emitLocation(location);
            
            dispatch(showSuccessToast({
              title: "EN LIGNE (Automatique)",
              message: "Pret a recevoir des courses.",
            }));
          } catch (err) {
            console.warn("[DriverHome] Erreur auto-connect:", err);
          }
        }
      }
    };

    processAutoConnect();
  }, [location, isAvailable, isDriverInZone, updateAvailability, dispatch]);

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

  // RESET AUTO-START
  useEffect(() => {
    if (currentRide?.status !== 'accepted') {
      hasAutoStartedRef.current = false;
    }
  }, [currentRide?.status]);

  // AUTO-START COURSE (GEOFENCING < 10 METRES)
  useEffect(() => {
    if (currentRide?.status === 'accepted' && location && !hasAutoStartedRef.current) {
      const target = currentRide.origin;
      const lat = target?.coordinates?.[1] || target?.latitude;
      const lng = target?.coordinates?.[0] || target?.longitude;

      if (lat && lng) {
        const distance = MapService.calculateDistance(
          location,
          { latitude: Number(lat), longitude: Number(lng) }
        );

        if (distance <= 10) {
          hasAutoStartedRef.current = true;
          handleAutoStartRide();
        }
      }
    }
  }, [location, currentRide]);

  const handleAutoStartRide = async () => {
    try {
      dispatch(showSuccessToast({
        title: "Client a bord",
        message: "Passage automatique en mode Voyage."
      }));
      await startRide({ rideId: currentRide._id }).unwrap();
    } catch (err) {
      console.warn("[DriverHome] Erreur auto-start:", err);
      hasAutoStartedRef.current = false;
    }
  };

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    
    if (newStatus && !isDriverInZone) {
      dispatch(showErrorToast({ 
        title: 'Acces Refuse', 
        message: 'Vous devez etre dans la zone de Mafere pour vous mettre en service.' 
      }));
      return;
    }

    try {
      const res = await updateAvailability({ isAvailable: newStatus }).unwrap();
      const actualStatus = res.data ? res.data.isAvailable : newStatus;
      
      setIsAvailable(actualStatus);
      dispatch(updateUserInfo({ isAvailable: actualStatus }));
      
      if (actualStatus && location) {
        socketService.emitLocation(location);
      }
      
      dispatch(showSuccessToast({
        title: actualStatus ? "EN LIGNE" : "HORS LIGNE",
        message: actualStatus ? "Pret pour les courses." : "Mode pause active.",
      }));
    } catch (err) {
      dispatch(showErrorToast({ title: "Erreur", message: "Echec changement statut." }));
    }
  };

  // ARCHITECTURE BYPASS : La carte detecte seule la ligne a tracer selon le type (pickup ou destination).
  const mapMarkers = useMemo(() => {
    if (!isRideActive || !currentRide) return [];
    
    const isOngoing = currentRide.status === 'ongoing';
    const target = isOngoing ? currentRide.destination : currentRide.origin;
    
    const lat = target?.coordinates?.[1] || target?.latitude;
    const lng = target?.coordinates?.[0] || target?.longitude;

    if (lat && lng) {
      return [{
        id: isOngoing ? 'destination' : 'pickup', 
        latitude: Number(lat), 
        longitude: Number(lng),
        title: target.address || (isOngoing ? "Destination" : "Client"), 
        iconColor: isOngoing ? THEME.COLORS.danger : THEME.COLORS.info,
        type: isOngoing ? 'destination' : 'pickup' 
      }];
    }
    return [];
  }, [isRideActive, currentRide]);

  const mapBottomPadding = isRideActive ? 300 : 320; 

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
             recenterBottomPadding={mapBottomPadding} 
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
  mapContainer: { ...StyleSheet.absoluteFillObject, flex: 1, zIndex: 1 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.glassDark },
  loadingText: { marginTop: 10, fontSize: 12, color: THEME.COLORS.textSecondary }
});

export default DriverHome;