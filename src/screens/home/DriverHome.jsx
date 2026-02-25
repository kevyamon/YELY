// src/screens/home/DriverHome.jsx
// HOME DRIVER - Auto-Online & Intelligence Spatiale (KML)
// CSCSM Level: Bank Grade

import { useEffect, useRef, useState } from 'react';
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
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

import { isLocationInMafereZone } from '../../utils/mafereZone';

const DriverHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const hasAutoConnected = useRef(false); // Verrou pour éviter les boucles d'auto-connexion
  const dispatch = useDispatch();
  
  const user = useSelector(selectCurrentUser);
  const { location, errorMsg } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const scrollY = useSharedValue(0);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();

  const isDriverInZone = isLocationInMafereZone(location);

  useEffect(() => {
    if (user?.isAvailable !== undefined) {
      setIsAvailable(user.isAvailable);
    }
  }, [user?.isAvailable]);

  // LOGIQUE D'AUTO-CONNEXION (Une seule fois par session d'ouverture)
  useEffect(() => {
    const processAutoConnect = async () => {
      if (!hasAutoConnected.current && location && !isAvailable) {
        hasAutoConnected.current = true; // On verrouille immédiatement

        if (isDriverInZone) {
          try {
            const res = await updateAvailability({ isAvailable: true }).unwrap();
            const actualStatus = res.data ? res.data.isAvailable : true;
            
            setIsAvailable(actualStatus);
            dispatch(updateUserInfo({ isAvailable: actualStatus }));
            socketService.emitLocation(location);
            
            dispatch(showSuccessToast({
              title: "EN LIGNE (Automatique)",
              message: "Prêt à recevoir des courses.",
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

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    
    if (newStatus && !isDriverInZone) {
      dispatch(showErrorToast({ 
        title: 'Accès Refusé', 
        message: 'Vous devez être dans la zone de Maféré pour vous mettre en service.' 
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
        message: actualStatus ? "Prêt pour les courses." : "Mode pause activé.",
      }));
    } catch (err) {
      dispatch(showErrorToast({ title: "Erreur", message: "Échec changement statut." }));
    }
  };

  const mapBottomPadding = 320; 

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
             markers={[]} 
             route={null} 
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

      <DriverRideOverlay />

      <SmartFooter 
        isAvailable={isAvailable}
        onToggle={handleToggleAvailability}
        isToggling={isToggling}
      />

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