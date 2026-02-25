// src/components/ride/DriverRideOverlay.jsx
// PANNEAU CHAUFFEUR - Guidage & Pont de Navigation Externe

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Dimensions, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { selectCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

const DriverRideOverlay = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const currentRide = useSelector(selectCurrentRide);
  const translateY = useSharedValue(300); 

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
  }, [translateY]);

  if (!currentRide) return null;

  const isOngoing = currentRide.status === 'ongoing';
  const target = isOngoing ? currentRide.destination : currentRide.origin;

  const handleCallRider = () => {
    const phoneUrl = `tel:${currentRide.riderPhone || '0000000000'}`;
    Linking.openURL(phoneUrl).catch(() => {
       dispatch(showErrorToast({ title: "Erreur", message: "Impossible de lancer l'appel." }));
    });
  };

  const handleOpenGPS = () => {
    // 🌍 Ouvre Google Maps / Apple Maps pour la navigation vocale
    const lat = target?.coordinates?.[1] || target?.latitude;
    const lng = target?.coordinates?.[0] || target?.longitude;
    
    if (!lat || !lng) {
      dispatch(showErrorToast({ title: "Erreur GPS", message: "Destination introuvable." }));
      return;
    }

    const label = encodeURIComponent("Course Yély");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });

    Linking.openURL(url).catch(() => {
       Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, { paddingBottom: insets.bottom + 10 }, animatedStyle]}>
      
      <View style={styles.statusBanner}>
        <View style={styles.statusIndicator}>
           <View style={[styles.dot, isOngoing && styles.dotOngoing]} />
        </View>
        <Text style={styles.statusText}>
          {isOngoing ? "Direction Destination" : "Aller chercher le client"}
        </Text>
      </View>

      <View style={styles.riderInfoCard}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={32} color={THEME.COLORS.champagneGold} />
        </View>
        
        <View style={styles.riderDetails}>
          <Text style={styles.riderName}>{currentRide.riderName || 'Client Yély'}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={THEME.COLORS.champagneGold} />
            <Text style={styles.ratingText}>5.0 • Client vérifié</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callButton} onPress={handleCallRider}>
          <Ionicons name="call" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <Ionicons name="navigate-circle" size={20} color={isOngoing ? THEME.COLORS.success : THEME.COLORS.danger} />
          <Text style={styles.routeText} numberOfLines={2}>
            {target?.address || 'Adresse de rencontre'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {/* BOUTON GPS : Secondaire pour la navigation vocale externe */}
        <TouchableOpacity style={styles.gpsButton} onPress={handleOpenGPS}>
          <Ionicons name="navigate" size={20} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>

        {/* BOUTON PRINCIPAL : Pour la Phase 8 */}
        <TouchableOpacity style={styles.primaryActionButton} disabled={true}>
          <Text style={styles.primaryActionText}>
            {isOngoing ? "TERMINER COURSE" : "CLIENT À BORD"}
          </Text>
        </TouchableOpacity>
      </View>

    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: width,
    backgroundColor: THEME.COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    elevation: 20,
    zIndex: 100,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.SPACING.md,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: THEME.COLORS.champagneGold },
  dotOngoing: { backgroundColor: THEME.COLORS.success },
  statusText: { fontSize: 16, fontWeight: '800', color: THEME.COLORS.textPrimary },
  riderInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    padding: THEME.SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    marginBottom: THEME.SPACING.md,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.COLORS.glassDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.COLORS.champagneGold,
  },
  riderDetails: { flex: 1, marginLeft: THEME.SPACING.md },
  riderName: { fontSize: 17, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 4 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: THEME.COLORS.textSecondary, fontWeight: '600' },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeContainer: {
    backgroundColor: THEME.COLORS.glassLight,
    padding: THEME.SPACING.md,
    borderRadius: 16,
    marginBottom: THEME.SPACING.md,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeText: { marginLeft: 8, color: THEME.COLORS.textSecondary, fontSize: 13, flex: 1, fontWeight: '700' },
  actionsContainer: { flexDirection: 'row', gap: THEME.SPACING.md, marginTop: THEME.SPACING.xs },
  gpsButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: THEME.COLORS.glassDark,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  primaryActionText: { color: THEME.COLORS.textSecondary, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});

export default DriverRideOverlay;