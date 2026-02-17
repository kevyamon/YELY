// src/screens/home/RiderHome.jsx
// HOME RIDER - Intégration Tracé GPS (Routing) & UX Modale Glass

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import DestinationSearchModal from '../../components/ui/DestinationSearchModal.jsx'; // Pivot UX
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
  
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null); 
  
  // NOUVEAU : État d'ouverture de la modale de recherche
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  
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

  const topPadding = insets.top + THEME.LAYOUT.HEADER_MAX_HEIGHT;

  const handleDestinationSelect = async (selectedPlace) => {
    setDestination(selectedPlace);
    
    if (location && mapRef.current) {
      const coords = await MapService.getRouteCoordinates(location, selectedPlace);
      
      if (coords && coords.length > 0) {
        setRouteCoords(coords);
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 120, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  };

  const mapMarkers = destination ? [{
    id: 'destination',
    latitude: destination.latitude,
    longitude: destination.longitude,
    title: destination.address,
    icon: 'flag',
    iconColor: THEME.COLORS.danger 
  }] : [];

  return (
    <ScreenWrapper>
      
      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.name?.split(' ')[0] || "Passager"}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={() => setIsSearchModalVisible(true)} // Ouvre la modale
      />

      <View style={[
        styles.mainContainer, 
        { paddingTop: topPadding, backgroundColor: THEME.COLORS.background }
      ]}>
        
        <View style={styles.mapSection}>
           {location ? (
             <MapCard 
               ref={mapRef}
               location={location}
               showUserMarker={true}
               darkMode={true}
               markers={mapMarkers}
               route={routeCoords ? { coordinates: routeCoords, color: THEME.COLORS.champagneGold, width: 4 } : null}
             />
           ) : (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
               <Text style={styles.loadingText}>Localisation en cours...</Text>
             </View>
           )}
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.forfaitsContainer}>
            <Text style={styles.sectionTitle}>NOS OFFRES</Text>
            
            {destination ? (
               <View style={styles.destinationCard}>
                  <Text style={styles.destinationTitle}>Destination choisie :</Text>
                  <Text style={styles.destinationText} numberOfLines={2}>{destination.address}</Text>
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

      {/* MODALE DE RECHERCHE FLUIDE */}
      <DestinationSearchModal 
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
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