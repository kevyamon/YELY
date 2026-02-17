// src/screens/home/RiderHome.jsx
// HOME RIDER
// Navigation vers 'Menu' activée
// Export propre en fin de fichier

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
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
  
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (location) {
      const getAddress = async () => {
        try {
          const addr = await MapService.reverseGeocode(location.latitude, location.longitude);
          if (addr && addr.shortName) setCurrentAddress(addr.shortName);
          else setCurrentAddress(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
        } catch (error) {
          setCurrentAddress("Adresse indisponible");
        }
      };
      getAddress();
    } else if (errorMsg) {
       setCurrentAddress("Signal GPS perdu");
    }
  }, [location, errorMsg]);

  const topPadding = insets.top + THEME.LAYOUT.HEADER_MAX_HEIGHT;

  return (
    <ScreenWrapper>
      
      {/* HEADER RIDER */}
      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.firstName || "Passager"}
        mode="rider"
        // ⚠️ NAVIGATION VERS LA PAGE MENU
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={() => console.log("Ouvrir recherche")}
      />

      <View style={[
        styles.mainContainer, 
        { paddingTop: topPadding, backgroundColor: THEME.COLORS.background }
      ]}>
        
        <View style={styles.mapSection}>
           {location ? (
             <MapCard 
               location={location}
               showUserMarker={true}
               darkMode={true}
             />
           ) : (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
               <Text style={{color: 'white', marginTop: 10, fontSize: 12}}>Localisation en cours...</Text>
             </View>
           )}
        </View>

        <View style={[styles.bottomSection, { backgroundColor: THEME.COLORS.background }]}>
          
          <View style={styles.forfaitsContainer}>
            <Text style={styles.sectionTitle}>NOS OFFRES</Text>
            
            <View style={styles.emptyCard}>
               <Text style={{color: THEME.COLORS.textTertiary, fontStyle: 'italic'}}>
                 Sélectionnez une destination
               </Text>
            </View>
            
            <View style={styles.dotsContainer}>
               <View style={[styles.dot, styles.dotActive]} />
               <View style={styles.dot} />
               <View style={styles.dot} />
            </View>
          </View>

        </View>

      </View>

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
    backgroundColor: '#1a1a1a', 
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
  bottomSection: {
    flex: 0.45, 
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  dotActive: { backgroundColor: THEME.COLORS.champagneGold, width: 20 }
});

export default RiderHome;