// src/screens/home/DriverHome.jsx
// HOME DRIVER - STRUCTURE SPLIT & GESTION ÉTAT
// Map (Haut) + Disponibilité/Stats (Bas)

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// Composants UI
import MapCard from '../../components/map/MapCard';
import ScreenHeader from '../../components/ui/ScreenHeader';
import ScreenWrapper from '../../components/ui/ScreenWrapper';

// Logique & Store
import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import { useUpdateAvailabilityMutation } from '../../store/api/usersApiSlice';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

export default function DriverHome({ navigation }) {
  const mapRef = useRef(null);
  const dispatch = useDispatch();
  
  // 1. DATA USER & LOCA
  const user = useSelector(selectCurrentUser);
  const { location, errorMsg } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  // État Disponibilité
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();

  // 2. REVERSE GEOCODING
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

  // 3. GESTION DISPONIBILITÉ
  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    try {
      const res = await updateAvailability({ isAvailable: newStatus }).unwrap();
      setIsAvailable(res.isAvailable);
      dispatch(updateUserInfo({ isAvailable: res.isAvailable }));
      
      dispatch(showSuccessToast({
        title: res.isAvailable ? "Vous êtes EN LIGNE" : "Vous êtes HORS LIGNE",
        message: res.isAvailable ? "Prêt à recevoir des courses." : "Vous ne recevrez plus de courses.",
      }));
    } catch (err) {
      console.error('[AVAILABILITY] Erreur:', err);
      dispatch(showErrorToast({
        title: "Erreur",
        message: "Impossible de changer votre statut.",
      }));
    }
  };

  return (
    <ScreenWrapper>

      {/* 1. HEADER (Fixe en haut) */}
      <ScreenHeader 
        showLocation={true}
        locationText={currentAddress}
      />

      {/* 2. CONTENU PRINCIPAL (Split View) */}
      <View style={styles.mainContainer}>

        {/* --- ZONE HAUTE : CARTE (55%) --- */}
        <View style={styles.mapSection}>
           {location ? (
             <MapCard 
               ref={mapRef}
               location={location}
               showUserMarker={true}
               darkMode={true}
               // Si driver dispo, on peut changer la couleur du marker (plus tard)
             />
           ) : (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
               <Text style={styles.loadingText}>Localisation...</Text>
             </View>
           )}
        </View>

        {/* --- ZONE BASSE : CONTRÔLES (45%) --- */}
        <View style={styles.bottomSection}>

          {/* CARTE DISPONIBILITÉ */}
          <View style={[styles.availabilityCard, isAvailable && styles.availabilityCardOnline]}>
            <View style={styles.availabilityRow}>
              
              {/* Infos Gauche */}
              <View style={styles.statusInfo}>
                <View style={styles.statusHeader}>
                  <Ionicons 
                    name={isAvailable ? "radio-button-on" : "radio-button-off"} 
                    size={18} 
                    color={isAvailable ? THEME.COLORS.success : THEME.COLORS.textTertiary} 
                  />
                  <Text style={[styles.statusTitle, isAvailable && { color: THEME.COLORS.success }]}>
                    {isAvailable ? 'EN SERVICE' : 'HORS LIGNE'}
                  </Text>
                </View>
                <Text style={styles.statusSubtitle}>
                  {isAvailable ? 'Recherche de courses en cours...' : 'Passez en ligne pour travailler'}
                </Text>
              </View>

              {/* Switch Droite */}
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                disabled={isToggling}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(46, 204, 113, 0.3)' }}
                thumbColor={isAvailable ? THEME.COLORS.success : '#f4f3f4'}
              />
            </View>
          </View>

          {/* DASHBOARD STATS RAPIDES */}
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

// Petit composant interne pour les stats
const StatBox = ({ icon, value, label, isGold }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={22} color={isGold ? THEME.COLORS.champagneGold : THEME.COLORS.textSecondary} />
    <Text style={[styles.statValue, isGold && { color: THEME.COLORS.champagneGold }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  
  // --- CARTE ---
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
  loadingText: {
    color: 'white', 
    marginTop: 10, 
    fontSize: 12
  },

  // --- CONTROLES ---
  bottomSection: {
    flex: 0.45,
    backgroundColor: THEME.COLORS.deepAsphalt,
    paddingTop: THEME.SPACING.xl,
    paddingHorizontal: THEME.SPACING.lg,
  },

  // Disponibilité
  availabilityCard: {
    backgroundColor: THEME.COLORS.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    padding: 16,
    marginBottom: 20,
  },
  availabilityCardOnline: {
    backgroundColor: 'rgba(46, 204, 113, 0.08)', // Vert très léger
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
    color: THEME.COLORS.textSecondary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  statusSubtitle: {
    color: THEME.COLORS.textTertiary,
    fontSize: 11,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    color: THEME.COLORS.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
  }
});