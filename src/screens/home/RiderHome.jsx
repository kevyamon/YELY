// src/screens/home/RiderHome.jsx
// HOME RIDER - STRUCTURE SCINDÉE & VRAIE LOCA
// Map (Haut) + Search/Forfaits (Bas)

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import MapCard from '../../components/map/MapCard';
import ScreenHeader from '../../components/ui/ScreenHeader';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import SearchBar from '../../components/ui/SearchBar';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import THEME from '../../theme/theme';

export default function RiderHome() {
  // 1. VRAIE GÉOLOCALISATION
  const { location, errorMsg } = useGeolocation(); 
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  // 2. RÉCUPÉRATION DE L'ADRESSE (Reverse Geocoding)
  useEffect(() => {
    if (location) {
      const getAddress = async () => {
        try {
          // Appel API réel pour convertir lat/long en texte
          const addr = await MapService.reverseGeocode(location.latitude, location.longitude);
          
          if (addr && addr.shortName) {
            setCurrentAddress(addr.shortName); // Ex: "Pharmacie de Maféré"
          } else {
            // Fallback : Coordonnées propres si pas de nom de rue
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

  return (
    <ScreenWrapper>
      
      {/* 1. HEADER (Fixe en haut) */}
      {/* Affiche la vraie adresse calculée ci-dessus */}
      <ScreenHeader 
        showLocation={true}
        locationText={currentAddress}
      />

      {/* 2. CONTENU PRINCIPAL (Split View) */}
      <View style={styles.mainContainer}>
        
        {/* PARTIE HAUTE : LA CARTE (~55% de l'écran) */}
        <View style={styles.mapSection}>
           {location ? (
             <MapCard 
               location={location} // Passe la VRAIE location à la carte
               showUserMarker={true}
               darkMode={true}
             />
           ) : (
             // Chargement si pas encore de GPS
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
               <Text style={{color: 'white', marginTop: 10, fontSize: 12}}>Localisation en cours...</Text>
             </View>
           )}
        </View>

        {/* PARTIE BASSE : RECHERCHE & FORFAITS (Le reste de l'écran) */}
        <View style={styles.bottomSection}>
          
          {/* Barre de Recherche */}
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
  },
  
  // ZONE CARTE (Haut)
  mapSection: {
    flex: 0.55, // 55% de la hauteur disponible
    overflow: 'hidden',
    borderBottomLeftRadius: 24, // Style arrondi moderne
    borderBottomRightRadius: 24,
    backgroundColor: '#1a1a1a', 
    zIndex: 1,
    // Petite ombre pour séparer du bas
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
    flex: 0.45, // 45% restant
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