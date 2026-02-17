// src/screens/home/DriverHome.web.jsx
// HOME DRIVER WEB - Layout Web avec Logique Unifiée et Fiabilisée

import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import useGeolocation from '../../hooks/useGeolocation';
import { useUpdateAvailabilityMutation } from '../../store/api/usersApiSlice';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DriverHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  
  const { location, address } = useGeolocation();
  const currentAddress = address || 'Localisation en cours...';

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();

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
      dispatch(showErrorToast({ title: "Erreur", message: "Impossible de changer votre statut." }));
    }
  };

  const topBarHeight = 70;
  const availableHeight = SCREEN_HEIGHT - insets.top - topBarHeight - insets.bottom;
  const mapHeight = availableHeight * 0.50;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ═══════ ZONE HAUTE : Adresse + Status + Menu ═══════ */}
      <View style={styles.topBar}>
        <View style={styles.locationContainer}>
          <View style={[styles.statusDot, isAvailable && styles.statusDotOnline]} />
          <Text numberOfLines={1} style={styles.locationText}>{currentAddress}</Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Ionicons name="menu-outline" size={26} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>

      {/* ═══════ ZONE CENTRALE : La Carte (Aérée) ═══════ */}
      <View style={[styles.mapWrapper, { height: mapHeight }]}>
        {location ? (
          <MapCard
            ref={mapRef}
            location={location}
            showUserMarker={true}
            showRecenterButton={true}
            floating={true}
            darkMode={true} // Forcé pour l'esthétique Yély
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
            <Text style={styles.loadingText}>Connexion au GPS...</Text>
          </View>
        )}
      </View>

      {/* ═══════ ZONE BASSE : Switch + Stats ═══════ */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + THEME.SPACING.sm }]}>

        <View style={[styles.availabilityCard, isAvailable && styles.availabilityCardOnline]}>
          <View style={styles.availabilityContent}>
            <View style={styles.availabilityInfo}>
              <View style={styles.availabilityHeader}>
                <Ionicons
                  name={isAvailable ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={isAvailable ? THEME.COLORS.success : THEME.COLORS.textTertiary}
                />
                <Text style={[styles.availabilityTitle, isAvailable && styles.availabilityTitleOnline]}>
                  {isAvailable ? 'En service' : 'Hors ligne'}
                </Text>
              </View>
              <Text style={styles.availabilityHint}>
                {isAvailable ? 'Vous recevez des courses' : 'Passez en ligne pour travailler'}
              </Text>
            </View>

            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              disabled={isToggling}
              trackColor={{ false: 'rgba(128,128,128,0.2)', true: 'rgba(46, 204, 113, 0.3)' }}
              thumbColor={isAvailable ? THEME.COLORS.success : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox icon="car-sport" value="0" label="Courses" />
          <StatBox icon="time" value="0h" label="Heures" />
          <StatBox icon="wallet" value="0 F" label="Gains" isGold />
        </View>
      </View>
    </View>
  );
};

const StatBox = ({ icon, value, label, isGold }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={20} color={isGold ? THEME.COLORS.champagneGold : THEME.COLORS.textSecondary} />
    <Text style={[styles.statValue, isGold && { color: THEME.COLORS.champagneGold }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.background,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassLight,
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.md,
    borderRadius: THEME.BORDERS.radius.lg,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
    marginRight: THEME.SPACING.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.COLORS.textTertiary,
  },
  statusDotOnline: {
    backgroundColor: THEME.COLORS.success,
  },
  locationText: {
    color: THEME.COLORS.textPrimary,
    marginLeft: THEME.SPACING.sm,
    fontSize: 12,
    flex: 1,
  },
  menuButton: {
    width: 46,
    height: 46,
    backgroundColor: THEME.COLORS.glassDark,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  mapWrapper: {
    marginTop: 20, 
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
    fontSize: 12,
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.lg,
  },
  availabilityCard: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  availabilityCardOnline: {
    borderColor: 'rgba(46, 204, 113, 0.3)',
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityTitle: {
    color: THEME.COLORS.textPrimary,
    fontWeight: 'bold',
  },
  availabilityTitleOnline: {
    color: THEME.COLORS.success,
  },
  availabilityHint: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    paddingVertical: 15,
  },
  statValue: {
    color: THEME.COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    color: THEME.COLORS.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
  },
});

export default DriverHome;