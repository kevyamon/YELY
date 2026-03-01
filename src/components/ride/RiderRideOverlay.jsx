// src/components/ride/RiderRideOverlay.jsx
// PANNEAU PASSAGER - Suivi du Chauffeur (Strictement Presentationnel)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { selectCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import { calculateDistanceInMeters, formatDistance } from '../../utils/distanceUtils';
import RideRouteDisplay from './RideRouteDisplay';

const { width } = Dimensions.get('window');

const BOARDING_DISPLAY_DELAY_MS = 60000;

const RIDER_STATUS = {
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  BOARDING: 'boarding',
  ONGOING: 'ongoing',
};

const RiderRideOverlay = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const currentRide = useSelector(selectCurrentRide);

  const [riderStatus, setRiderStatus] = useState(RIDER_STATUS.APPROACHING);
  const boardingTimerRef = useRef(null);

  const translateY = useSharedValue(300);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
  }, [translateY]);

  useEffect(() => {
    if (boardingTimerRef.current) {
      clearTimeout(boardingTimerRef.current);
      boardingTimerRef.current = null;
    }

    const arrivedAt = currentRide?.arrivedAt;
    const status = currentRide?.status;

    if (status === 'ongoing') {
      setRiderStatus(RIDER_STATUS.ONGOING);
      return;
    }

    if (!arrivedAt) {
      setRiderStatus(RIDER_STATUS.APPROACHING);
      return;
    }

    const elapsed = Date.now() - arrivedAt;
    const remaining = BOARDING_DISPLAY_DELAY_MS - elapsed;

    if (remaining <= 0) {
      setRiderStatus(RIDER_STATUS.BOARDING);
    } else {
      setRiderStatus(RIDER_STATUS.ARRIVED);
      boardingTimerRef.current = setTimeout(() => {
        setRiderStatus(RIDER_STATUS.BOARDING);
      }, remaining);
    }

    return () => {
      if (boardingTimerRef.current) clearTimeout(boardingTimerRef.current);
    };
  }, [currentRide?.arrivedAt, currentRide?.status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!currentRide) return null;

  const isOngoing = currentRide.status === 'ongoing';

  const driverLat =
    currentRide?.driverLocation?.coordinates?.[1] ||
    currentRide?.driverLocation?.latitude;
  const driverLng =
    currentRide?.driverLocation?.coordinates?.[0] ||
    currentRide?.driverLocation?.longitude;

  const target = isOngoing ? currentRide.destination : currentRide.origin;
  const targetLat = target?.coordinates?.[1] || target?.latitude;
  const targetLng = target?.coordinates?.[0] || target?.longitude;

  const liveDistance = useMemo(() => {
    return calculateDistanceInMeters(driverLat, driverLng, targetLat, targetLng);
  }, [driverLat, driverLng, targetLat, targetLng]);

  const resolveStatusLabel = () => {
    switch (riderStatus) {
      case RIDER_STATUS.ARRIVED:
        return 'Chauffeur arrive';
      case RIDER_STATUS.BOARDING:
        return 'Client a bord';
      case RIDER_STATUS.ONGOING:
        return `Trajet en cours (${formatDistance(liveDistance)})`;
      default:
        return `En approche (${formatDistance(liveDistance)})`;
    }
  };

  const resolveDotStyle = () => {
    switch (riderStatus) {
      case RIDER_STATUS.ARRIVED:
        return styles.dotArrived;
      case RIDER_STATUS.BOARDING:
        return styles.dotBoarding;
      case RIDER_STATUS.ONGOING:
        return styles.dotOngoing;
      default:
        return null;
    }
  };

  const handleCallDriver = () => {
    const phoneUrl = `tel:${currentRide.driverPhone || '0000000000'}`;
    Linking.openURL(phoneUrl).catch(() => {
      dispatch(showErrorToast({ title: 'Erreur', message: "Appel impossible." }));
    });
  };

  return (
    <Animated.View style={[styles.container, { paddingBottom: insets.bottom + 10 }, animatedStyle]}>

      <View style={styles.statusBanner}>
        <View style={styles.statusIndicator}>
          <View style={[styles.dot, resolveDotStyle()]} />
        </View>
        <Text style={styles.statusText}>{resolveStatusLabel()}</Text>
      </View>

      <View style={styles.driverInfoCard}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={32} color={THEME.COLORS.champagneGold} />
        </View>

        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>
            {currentRide.driverName || 'Chauffeur Assigne'}
          </Text>
          <View style={styles.carBadge}>
            <Text style={styles.carText}>Vehicule Confirme</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <RideRouteDisplay
        originAddress={currentRide.origin?.address}
        destinationAddress={currentRide.destination?.address}
        isOngoing={isOngoing}
        variant="rider"
      />

      <View style={styles.actionsContainer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Montant Final</Text>
          <Text style={styles.priceValue}>
            {currentRide.proposedPrice || currentRide.price} F
          </Text>
        </View>
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
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 100,
  },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: THEME.SPACING.md },
  statusIndicator: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(212, 175, 55, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: THEME.COLORS.champagneGold },
  dotOngoing: { backgroundColor: THEME.COLORS.success },
  dotArrived: { backgroundColor: THEME.COLORS.info },
  dotBoarding: { backgroundColor: '#9B59B6' },
  statusText: { fontSize: 16, fontWeight: '800', color: THEME.COLORS.textPrimary },
  driverInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface, padding: THEME.SPACING.md, borderRadius: 20, borderWidth: 1, borderColor: THEME.COLORS.border, marginBottom: THEME.SPACING.md },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: THEME.COLORS.champagneGold },
  driverDetails: { flex: 1, marginLeft: THEME.SPACING.md },
  driverName: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 4 },
  carBadge: { backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  carText: { fontSize: 12, color: THEME.COLORS.textSecondary, fontWeight: '600' },
  callButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: THEME.COLORS.success, justifyContent: 'center', alignItems: 'center', shadowColor: THEME.COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: THEME.SPACING.sm },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 11, color: THEME.COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' },
  priceValue: { fontSize: 24, fontWeight: '900', color: THEME.COLORS.textPrimary },
});

export default RiderRideOverlay;