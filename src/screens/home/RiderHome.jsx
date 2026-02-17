// src/screens/home/RiderHome.jsx
// HOME RIDER - STRUCTURE SCINDÉE & VRAIE LOCA
// Map (Haut) + Search/Forfaits (Bas)

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated'; // Pour le SmartHeader
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Pour le calcul du padding
import { useSelector } from 'react-redux'; // Pour le nom utilisateur

import MapCard from '../../components/map/MapCard';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import SearchBar from '../../components/ui/SearchBar';
import SmartHeader from '../../components/ui/SmartHeader'; // ✅ On utilise le nouveau Header

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

export default function RiderHome({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  
  // 1. VRAIE GÉOLOCALISATION
  const { location, errorMsg } = useGeolocation(); 
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  // Variable d'animation pour le header (reste à 0 car pas de scroll ici)
  const scrollY = useSharedValue(0);
  
  // 2. RÉCUPÉRATION DE L'ADRESSE (Reverse Geocoding)
  useEffect(() => {
    if (location) {
      const getAddress = async () => {
        try {
          const addr = await MapService.reverseGeocode(location.latitude, location.longitude);
          if (addr && addr.shortName) {
            setCurrentAddress(addr.shortName);
          } else {
            setCurrentAddress(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.log("Erreur Geo", error);
          setCurrentAddress("Adresse indisponible");
        }
      };
      getAddress();
    } else if (errorMsg) {
       setCurrentAddress("Signal GPS perdu");
    }
  }, [location, errorMsg]);

  // 📐 CALCUL DU PADDING : On pousse le contenu sous le Header Max Height
  // On ajoute un petit bonus (+10) pour l'aération
  const contentPaddingTop = insets.top + THEME.LAYOUT.HEADER_MAX_HEIGHT - 10;

  return (
    <ScreenWrapper>
      
      {/* 1. HEADER (Fixe en haut - Style Canva) */}
      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.name?.split(' ')[0] || "Passager"}
        onMenuPress={() => navigation.openDrawer()}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={() => console.log("Ouvrir recherche")}
      />

      {/* 2. CONTENU PRINCIPAL (Split View) */}
      {/* ⚠️ CORRECTION : On applique le padding ici pour descendre tout le bloc */}
      <View style={[styles.mainContainer, { paddingTop: contentPaddingTop }]}>
        
        {/* PARTIE HAUTE : LA CARTE (~55% de l'écran) */}
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

        {/* PARTIE BASSE : RECHERCHE & FORFAITS (Le reste de l'écran) */}
        <View style={styles.bottomSection}>
          
          {/* Barre de Recherche (Gardée comme dans ton fichier original) */}
          {/* Note : Tu peux la retirer si tu utilises celle du header, mais je la laisse comme demandé */}
          <View style={styles.searchContainer}>
            <SearchBar 
              label="On va où ?"
              hint="Saisissez votre destination"
              onPress={() => console.log("Ouvrir recherche")}
            />
          </View>

          {/* Zone Forfaits (Placeholder pour la Phase 5) */}
          <View style={styles.forfaitsContainer}>
            <Text style={styles.sectionTitle}>NOS OFFRES</Text>
            
            {/* Carte placeholder */}
            <View style={styles.emptyCard}>
               <Text style={{color: THEME.COLORS.textTertiary, fontStyle: 'italic'}}>
                 Sélectionnez une destination pour voir les tarifs
               </Text>
            </View>
            
            {/* Indicateurs (Dots) */}
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
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
    // backgroundColor: THEME.COLORS.background, // Optionnel
  },
  
  // ZONE CARTE (Haut)
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

  // ZONE BASSE (Bas)
  bottomSection: {
    flex: 0.45, 
    backgroundColor: THEME.COLORS.deepAsphalt,
    paddingTop: THEME.SPACING.xl,
    paddingHorizontal: THEME.SPACING.lg,
  },
  
  searchContainer: {
    marginBottom: THEME.SPACING.xl,
  },

  forfaitsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
    letterSpacing: 1.5,
  },
  emptyCard: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  dotActive: { backgroundColor: THEME.COLORS.champagneGold, width: 20 }
});