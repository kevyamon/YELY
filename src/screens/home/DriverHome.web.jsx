// src/screens/home/DriverHome.web.jsx
// HOME DRIVER WEB - UX Immersion Totale Edge-to-Edge

import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import SmartFooter from '../../components/ui/SmartFooter';

import useGeolocation from '../../hooks/useGeolocation';
import { useUpdateAvailabilityMutation } from '../../store/api/usersApiSlice';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

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

  // Padding Web
  const mapBottomPadding = 220; 

  return (
    <View style={styles.container}>

      {/* LA CARTE (Absolue 100% Edge-to-Edge) */}
      <View style={styles.mapWrapper}>
        {location ? (
          <MapCard
            ref={mapRef}
            location={location}
            showUserMarker={true}
            showRecenterButton={true}
            floating={false} // Force le mode Edge-to-Edge sur le Web aussi
            darkMode={true} 
            recenterBottomPadding={mapBottomPadding}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
          </View>
        )}
      </View>

      {/* L'ARC DU HAUT */}
      <View style={[styles.topBar, { paddingTop: insets.top + THEME.SPACING.md }]}>
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

      {/* L'ARC DU BAS */}
      <SmartFooter 
        isAvailable={isAvailable}
        onToggle={handleToggleAvailability}
        isToggling={isToggling}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative', 
    backgroundColor: THEME.COLORS.background,
  },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.md,
    backgroundColor: THEME.COLORS.background,
    // DESIGN ORGANIQUE
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  }
});

export default DriverHome;