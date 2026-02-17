// src/screens/home/DriverHome.web.jsx

import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Dimensions, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
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
  
  // UTILISATION DU HOOK UNIFIÉ (Plus de useEffect local)
  const { location, address } = useGeolocation();
  
  // Utilisation directe de l'adresse du hook ou fallback
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
        title: res.isAvailable ? "En ligne !" : "Hors ligne",
        message: res.message,
      }));
    } catch (err) {
      console.error('[AVAILABILITY] Erreur:', err);
      dispatch(showErrorToast({
        title: "Erreur",
        message: err?.data?.message || "Impossible de changer votre statut.",
      }));
    }
  };

  const topBarHeight = 70;
  const availableHeight = SCREEN_HEIGHT - insets.top - topBarHeight - insets.bottom;
  const mapHeight = availableHeight * 0.50;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ═══════ ZONE HAUTE : Adresse + Status + Hamburger ═══════ */}
      <View style={styles.topBar}>
        <View style={styles.locationContainer}>
          <View style={[styles.statusDot, isAvailable && styles.statusDotOnline]} />
          <Text numberOfLines={1} style={styles.locationText}>{currentAddress}</Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu-outline" size={26} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>

      {/* ═══════ ZONE CENTRALE : La Carte ═══════ */}
      <View style={{ height: mapHeight }}>
        <MapCard
          ref={mapRef}
          location={location}
          showUserMarker
          showRecenterButton
          floating
          darkMode
        />
      </View>

      {/* ═══════ ZONE BASSE : Switch + Infos ═══════ */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + THEME.SPACING.sm }]}>

        {/* Carte de disponibilité */}
        <View style={[styles.availabilityCard, isAvailable && styles.availabilityCardOnline]}>
          <View style={styles.availabilityContent}>
            <View style={styles.availabilityInfo}>
              <View style={styles.availabilityHeader}>
                <Ionicons
                  name={isAvailable ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={isAvailable ? THEME.COLORS.success : THEME.COLORS.textTertiary}
                />
                <Text style={[
                  styles.availabilityTitle,
                  isAvailable && styles.availabilityTitleOnline,
                ]}>
                  {isAvailable ? 'En service' : 'Hors ligne'}
                </Text>
              </View>
              <Text style={styles.availabilityHint}>
                {isAvailable
                  ? 'Vous recevez des courses'
                  : 'Activez pour recevoir des courses'
                }
              </Text>
            </View>

            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              disabled={isToggling}
              trackColor={{
                false: 'rgba(242, 244, 246, 0.15)',
                true: 'rgba(46, 204, 113, 0.35)',
              }}
              thumbColor={isAvailable ? THEME.COLORS.success : THEME.COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Stats rapides */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="car-outline" size={20} color={THEME.COLORS.champagneGold} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color={THEME.COLORS.champagneGold} />
            <Text style={styles.statValue}>0h</Text>
            <Text style={styles.statLabel}>En ligne</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={20} color={THEME.COLORS.champagneGold} />
            <Text style={styles.statValue}>0F</Text>
            <Text style={styles.statLabel}>Gains</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.deepAsphalt,
  },

  // ─── ZONE HAUTE ───
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.deepAsphalt,
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
    color: THEME.COLORS.moonlightWhite,
    marginLeft: THEME.SPACING.sm,
    fontSize: THEME.FONTS.sizes.bodySmall,
    flex: 1,
  },
  menuButton: {
    width: 46,
    height: 46,
    backgroundColor: THEME.COLORS.glassDark,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
  },

  // ─── ZONE BASSE ───
  bottomSection: {
    flex: 1,
    backgroundColor: THEME.COLORS.deepAsphalt,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.lg,
  },

  // ─── CARTE DISPONIBILITÉ ───
  availabilityCard: {
    backgroundColor: THEME.COLORS.glassMedium,
    borderRadius: THEME.BORDERS.radius.xl,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
  },
  availabilityCardOnline: {
    borderColor: 'rgba(46, 204, 113, 0.30)',
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.lg,
  },
  availabilityInfo: {
    flex: 1,
    marginRight: THEME.SPACING.md,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.sm,
  },
  availabilityTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.semiBold,
  },
  availabilityTitleOnline: {
    color: THEME.COLORS.success,
  },
  availabilityHint: {
    color: THEME.COLORS.textTertiary,
    fontSize: THEME.FONTS.sizes.caption,
    marginTop: THEME.SPACING.xxs,
    marginLeft: THEME.SPACING.xxl + THEME.SPACING.sm,
  },

  // ─── STATS ───
  statsRow: {
    flexDirection: 'row',
    gap: THEME.SPACING.sm,
    marginTop: THEME.SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassMedium,
    borderRadius: THEME.BORDERS.radius.lg,
    borderWidth: THEME.BORDERS.width.thin,
    borderColor: THEME.COLORS.glassBorder,
    paddingVertical: THEME.SPACING.lg,
    gap: THEME.SPACING.xs,
  },
  statValue: {
    color: THEME.COLORS.moonlightWhite,
    fontSize: THEME.FONTS.sizes.h4,
    fontWeight: THEME.FONTS.weights.bold,
  },
  statLabel: {
    color: THEME.COLORS.textTertiary,
    fontSize: THEME.FONTS.sizes.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default DriverHome;