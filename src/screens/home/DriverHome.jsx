// src/screens/home/DriverHome.jsx
// HOME DRIVER - CORRIGÉ (Statistiques & Carte Statut visibles en mode Jour)

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View, useColorScheme } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import { useUpdateAvailabilityMutation } from '../../store/api/usersApiSlice';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

export default function DriverHome({ navigation }) {
  const mapRef = useRef(null);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark'; 
  
  const user = useSelector(selectCurrentUser);
  const { location, errorMsg } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const scrollY = useSharedValue(0);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();

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
      setCurrentAddress("Erreur GPS");
    }
  }, [location, errorMsg]);

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    try {
      const res = await updateAvailability({ isAvailable: newStatus }).unwrap();
      setIsAvailable(res.isAvailable);
      dispatch(updateUserInfo({ isAvailable: res.isAvailable }));
      
      dispatch(showSuccessToast({
        title: res.isAvailable ? "EN LIGNE" : "HORS LIGNE",
        message: res.isAvailable ? "Prêt pour les courses." : "Mode pause activé.",
      }));
    } catch (err) {
      console.error('[AVAILABILITY] Erreur:', err);
      dispatch(showErrorToast({ title: "Erreur", message: "Échec changement statut." }));
    }
  };

  const topPadding = insets.top + THEME.LAYOUT.HEADER_MAX_HEIGHT;

  return (
    <ScreenWrapper>

      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.name?.split(' ')[0] || "Chauffeur"}
        mode="driver"
        onMenuPress={() => navigation.openDrawer()}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {/* 1. LE FOND PRINCIPAL (S'adapte Jour/Nuit) */}
      <View style={[
        styles.mainContainer, 
        { paddingTop: topPadding, backgroundColor: THEME.COLORS.background } 
      ]}>

        {/* 2. SECTION CARTE */}
        <View style={[styles.mapSection, { backgroundColor: isDark ? '#1a1a1a' : '#e0e0e0' }]}>
           {location ? (
             <MapCard 
               ref={mapRef}
               location={location}
               showUserMarker={true}
               darkMode={isDark}
             />
           ) : (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
               <Text style={[styles.loadingText, { color: THEME.COLORS.textSecondary }]}>Localisation...</Text>
             </View>
           )}
        </View>

        {/* 3. SECTION DU BAS (Celle qui posait problème) */}
        <View style={[styles.bottomSection, { backgroundColor: THEME.COLORS.background }]}>
          
          {/* CARTE DE STATUT (En Ligne / Hors Ligne) */}
          <View style={[
            styles.availabilityCard, 
            { 
              // C'est ici le secret : On utilise glassSurface (qui devient blanc opaque le jour)
              backgroundColor: THEME.COLORS.glassSurface,
              // Et on force la bordure grise visible
              borderColor: THEME.COLORS.border,
              borderWidth: 1 // On s'assure que l'épaisseur est là
            }, 
            isAvailable && styles.availabilityCardOnline
          ]}>
            <View style={styles.availabilityRow}>
              <View style={styles.statusInfo}>
                <View style={styles.statusHeader}>
                  <Ionicons 
                    name={isAvailable ? "radio-button-on" : "radio-button-off"} 
                    size={18} 
                    color={isAvailable ? THEME.COLORS.success : THEME.COLORS.textTertiary} 
                  />
                  <Text style={[
                      styles.statusTitle, 
                      { color: THEME.COLORS.textPrimary }, // Noir le jour / Blanc la nuit
                      isAvailable && { color: THEME.COLORS.success }
                    ]}>
                    {isAvailable ? 'EN SERVICE' : 'HORS LIGNE'}
                  </Text>
                </View>
                <Text style={[styles.statusSubtitle, { color: THEME.COLORS.textSecondary }]}>
                  {isAvailable ? 'En attente de courses...' : 'Passez en ligne pour travailler'}
                </Text>
              </View>

              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                disabled={isToggling}
                trackColor={{ false: 'rgba(128,128,128,0.3)', true: 'rgba(46, 204, 113, 0.3)' }}
                thumbColor={isAvailable ? THEME.COLORS.success : '#f4f3f4'}
              />
            </View>
          </View>

          {/* LES STATS (Les 3 carrés) */}
          <View style={styles.statsContainer}>
            <StatBox icon="car-sport" value="0" label="Courses" />
            <StatBox icon="time" value="0h" label="Heures" />
            <StatBox icon="wallet" value="0 F" label="Gains" isGold />
          </View>

        </View>

      </View>
    </ScreenWrapper>
  );
}

// COMPOSANT STATBOX CORRIGÉ
// Avant : il avait souvent des couleurs "white" forcées.
// Maintenant : il écoute le THÈME.
const StatBox = ({ icon, value, label, isGold }) => (
  <View style={[
    styles.statBox, 
    { 
      backgroundColor: THEME.COLORS.glassSurface, // Devient Blanc pur ou Gris vitré
      borderColor: THEME.COLORS.border,           // Le contour gris visible
      borderWidth: 1
    }
  ]}>
    <Ionicons 
      name={icon} 
      size={22} 
      // L'icône change de couleur selon le thème (pas juste blanc)
      color={isGold ? THEME.COLORS.champagneGold : THEME.COLORS.textSecondary} 
    />
    <Text style={[
      styles.statValue, 
      { color: THEME.COLORS.textPrimary }, // LE TEXTE DEVIENT NOIR EN MODE JOUR
      isGold && { color: THEME.COLORS.champagneGold }
    ]}>
      {value}
    </Text>
    <Text style={[
      styles.statLabel, 
      { color: THEME.COLORS.textTertiary }
    ]}>
      {label}
    </Text>
  </View>
);

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
  },
  loadingText: {
    marginTop: 10, 
    fontSize: 12
  },
  bottomSection: {
    flex: 0.45,
    paddingTop: THEME.SPACING.xl,
    paddingHorizontal: THEME.SPACING.lg,
  },
  availabilityCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    // On enlève les styles fixes ici pour laisser le style dynamique (dans le JSX) gérer
  },
  availabilityCardOnline: {
    backgroundColor: 'rgba(46, 204, 113, 0.08)', // Vert très clair, ça passe sur blanc et noir
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  statusTitle: {
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  statusSubtitle: {
    fontSize: 11,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    // shadowColor etc géré par le thème si besoin, restons simple pour le contraste
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  }
});