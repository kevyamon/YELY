// src/screens/home/RiderHome.jsx
// HOME RIDER - UX Aérée & Couleurs Thème

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import DestinationSearchSheet from '../../components/ui/DestinationSearchSheet'; // INTÉGRATION PHASE 4
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const RiderHome = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  
  const { location, errorMsg } = useGeolocation(); 
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  // NOUVEAU : État pour la destination choisie et ref pour le bottom sheet
  const [destination, setDestination] = useState(null);
  const searchSheetRef = useRef(null);
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

  // Ajustement de l'espacement pour ne pas coller au Header
  const topPadding = insets.top + THEME.LAYOUT.HEADER_MAX_HEIGHT;

  // NOUVEAU : Fonction appelée quand le sheet renvoie une destination
  const handleDestinationSelect = (selectedPlace) => {
    setDestination(selectedPlace);
    
    // Zoomer pour voir la position actuelle ET la destination
    if (location && mapRef.current) {
      const coords = [
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude }
      ];
      // On encadre les deux points avec une marge (padding)
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // NOUVEAU : Fonction pour ouvrir le tiroir
  const handleOpenSearch = () => {
    if (searchSheetRef.current) {
      searchSheetRef.current.snapToIndex(1); // 1 = le snapPoint à 85% défini dans DestinationSearchSheet
    }
  };

  // Préparation des marqueurs pour MapCard
  const mapMarkers = destination ? [{
    id: 'destination',
    latitude: destination.latitude,
    longitude: destination.longitude,
    title: destination.address,
    icon: 'flag',
    iconColor: THEME.COLORS.danger // Couleur différente pour bien distinguer la destination
  }] : [];

  return (
    <ScreenWrapper>
      
      {/* HEADER RIDER */}
      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.name?.split(' ')[0] || "Passager"}
        mode="rider"
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={handleOpenSearch} // CONNEXION DU BOUTON
      />

      <View style={[
        styles.mainContainer, 
        { paddingTop: topPadding, backgroundColor: THEME.COLORS.background }
      ]}>
        
        {/* SECTION CARTE */}
        <View style={styles.mapSection}>
           {location ? (
             <MapCard 
               ref={mapRef}
               location={location}
               showUserMarker={true}
               darkMode={true}
               markers={mapMarkers} // Ajout du marqueur destination s'il existe
             />
           ) : (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
               <Text style={styles.loadingText}>Localisation en cours...</Text>
             </View>
           )}
        </View>

        {/* SECTION OFFRES (Bas de page) */}
        <View style={styles.bottomSection}>
          
          <View style={styles.forfaitsContainer}>
            <Text style={styles.sectionTitle}>NOS OFFRES</Text>
            
            {destination ? (
               // Si une destination est choisie, on affiche un résumé temporaire en attendant la Phase 5
               <View style={styles.destinationCard}>
                  <Text style={styles.destinationTitle}>Destination choisie :</Text>
                  <Text style={styles.destinationText}>{destination.address}</Text>
                  <Text style={styles.phase5Text}>Les forfaits s'afficheront ici (Phase 5)</Text>
               </View>
            ) : (
               <View style={styles.emptyCard}>
                 <Text style={styles.emptyCardText}>
                   Sélectionnez une destination
                 </Text>
               </View>
            )}
            
            <View style={styles.dotsContainer}>
               <View style={[styles.dot, styles.dotActive]} />
               <View style={styles.dot} />
               <View style={styles.dot} />
            </View>
          </View>

        </View>

      </View>

      {/* LE TIROIR DE RECHERCHE */}
      <DestinationSearchSheet 
        ref={searchSheetRef}
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
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
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
    paddingHorizontal: THEME.SPACING.lg,
  },

  forfaitsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },

  sectionTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 15,
    alignSelf: 'flex-start',
    letterSpacing: 2,
  },

  emptyCard: {
    width: '100%',
    height: 110,
    backgroundColor: THEME.COLORS.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyCardText: {
    color: THEME.COLORS.textTertiary, 
    fontStyle: 'italic'
  },
  
  destinationCard: {
    width: '100%',
    height: 110,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.champagneGold,
    padding: 15,
    justifyContent: 'center',
    marginBottom: 20,
  },
  
  destinationTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  
  destinationText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  
  phase5Text: {
    color: THEME.COLORS.danger,
    fontSize: 12,
    fontStyle: 'italic',
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: THEME.COLORS.glassBorder 
  },

  dotActive: { 
    backgroundColor: THEME.COLORS.champagneGold, 
    width: 20 
  }
});

export default RiderHome;