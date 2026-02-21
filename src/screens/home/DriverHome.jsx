// src/screens/home/DriverHome.jsx
// HOME DRIVER - UX Immersion Totale & Balise Radar (Socket)

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import socketService from '../../services/socketService'; // 🚀 NOUVEAU : Import du radar
import { useUpdateAvailabilityMutation } from '../../store/api/usersApiSlice';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const DriverHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const dispatch = useDispatch();
  
  const user = useSelector(selectCurrentUser);
  const { location, errorMsg } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const scrollY = useSharedValue(0);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();

  // 🚀 NOUVEAU : La Balise Radar. Dès que le GPS bouge et qu'on est en ligne, on prévient le serveur !
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
      
      // Si on passe en ligne, on force l'envoi de la position immédiatement
      if (res.isAvailable && location) {
        socketService.emitLocation(location);
      }
      
      dispatch(showSuccessToast({
        title: res.isAvailable ? "EN LIGNE" : "HORS LIGNE",
        message: res.isAvailable ? "Prêt pour les courses." : "Mode pause activé.",
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
             floating={false} // Immersion Totale
             markers={[]} // Sécurité anti-crash
             route={null} // Sécurité anti-crash
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

      <SmartFooter 
        isAvailable={isAvailable}
        onToggle={handleToggleAvailability}
        isToggling={isToggling}
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
    flex: 1, 
    zIndex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark,
  },
  loadingText: {
    marginTop: 10, 
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
  }
});

export default DriverHome;