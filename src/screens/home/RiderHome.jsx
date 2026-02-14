// src/screens/home/RiderHome.jsx
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Composants
import MapCard from '../../components/map/MapCard';
import ScreenHeader from '../../components/ui/ScreenHeader'; // Le nouveau Header
import ScreenWrapper from '../../components/ui/ScreenWrapper'; // Le nouveau Wrapper
import SearchBar from '../../components/ui/SearchBar';

import useGeolocation from '../../hooks/useGeolocation';
import THEME from '../../theme/theme';

export default function RiderHome() {
  const { location } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Localisation...');

  useEffect(() => {
    if (location) {
      // Simulation appel service
      const getAddr = async () => {
         // const addr = await MapService.reverseGeocode...
         setCurrentAddress("Maféré, Centre ville");
      };
      getAddr();
    }
  }, [location]);

  return (
    // 1. SCREEN WRAPPER : Gère le Notch (paddingTop automatique)
    <ScreenWrapper>
      
      {/* 2. HEADER COMMANDANT : Fixe en haut de la zone sûre */}
      <ScreenHeader 
        showLocation={true}
        locationText={currentAddress}
      />

      {/* 3. CONTENU PRINCIPAL : Prend tout l'espace RESTANT */}
      <View style={styles.mainContent}>
        
        {/* LA CARTE : Remplit le conteneur mainContent (donc s'arrête sous le header) */}
        <View style={styles.mapContainer}>
           <MapCard 
             location={location}
             showUserMarker={true}
             darkMode={true}
           />
        </View>

        {/* UI BASSE : Flotte par-dessus la carte, mais ancrée en bas du mainContent */}
        <View style={styles.bottomOverlay}>
          <SearchBar 
             label="On va où ?"
             hint="Destination..."
             onPress={() => console.log("Search")}
          />
          
          {/* Indicateurs Forfaits */}
          <View style={styles.dotsContainer}>
             <View style={[styles.dot, styles.dotActive]} />
             <View style={styles.dot} />
          </View>
        </View>

      </View>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1, // Prend toute la hauteur restante sous le Header
    position: 'relative', // Pour que les enfants absolus se réfèrent à ça
    overflow: 'hidden', // Coupe tout ce qui dépasse (Sécurité Vortex)
    borderTopLeftRadius: 20, // Optionnel : Effet "Carte glissée sous le header"
    borderTopRightRadius: 20,
    marginTop: -15, // PETIT HACK VISUEL : Pour que la carte semble connectée au header
    paddingTop: 15, // On compense
    backgroundColor: THEME.COLORS.deepAsphalt,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject, // Rempli le mainContent
    zIndex: 0,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: THEME.SPACING.lg,
    zIndex: 10,
    // Pas de background ici pour laisser voir la carte autour des boutons
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: THEME.COLORS.champagneGold, width: 24 }
});