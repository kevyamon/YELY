// src/components/ride/DriverRideOverlay.jsx
// PANNEAU CHAUFFEUR - Guidage, Statuts de Proximite & Affichage Embarquement

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Linking,
  Modal,
  Platform,
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

import { selectCurrentRide, selectEffectiveLocation } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

// Doit etre identique a BOARDING_DISPLAY_DELAY_MS dans DriverHome
const BOARDING_DISPLAY_DELAY_MS = 60000;

const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) *
    Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DRIVER_STATUS = {
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  BOARDING: 'boarding',
  ONGOING: 'ongoing',
};

const BANNER_CONFIG = {
  [DRIVER_STATUS.APPROACHING]: {
    label: 'EN APPROCHE',
    dotStyle: null,
    containerStyle: null,
  },
  [DRIVER_STATUS.ARRIVED]: {
    label: 'Chauffeur arrive',
    dotStyle: 'dotArrived',
    containerStyle: 'passiveStatusArrived',
    subLabel: 'En attente du client...',
  },
  [DRIVER_STATUS.BOARDING]: {
    label: 'Client a bord',
    dotStyle: 'dotBoarding',
    containerStyle: 'passiveStatusBoarding',
    subLabel: 'Depart imminent...',
  },
  [DRIVER_STATUS.ONGOING]: {
    label: 'TRAJET EN COURS',
    dotStyle: 'dotOngoing',
    containerStyle: 'passiveStatusOngoing',
  },
};

const DriverRideOverlay = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const currentRide = useSelector(selectCurrentRide);
  // Position effective publiee par DriverHome (simulee en dev, GPS reel en prod)
  const effectiveLocation = useSelector(selectEffectiveLocation);

  const [localStatus, setLocalStatus] = useState(currentRide?.status);
  const [showNavModal, setShowNavModal] = useState(currentRide?.status === 'accepted');
  const [driverStatus, setDriverStatus] = useState(DRIVER_STATUS.APPROACHING);
  const boardingTimerRef = useRef(null);

  const translateY = useSharedValue(300);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
  }, [translateY]);

  useEffect(() => {
    if (currentRide?.status && currentRide.status !== localStatus) {
      setLocalStatus(currentRide.status);
    }
  }, [currentRide?.status, localStatus]);

  // Gestion du statut d'affichage embarquement.
  // arrivedAt est pose par DriverHome quand le chauffeur arrive au pickup.
  // Ce composant ne fait qu'afficher — le depart reel est pilote par DriverHome.
  useEffect(() => {
    if (boardingTimerRef.current) {
      clearTimeout(boardingTimerRef.current);
      boardingTimerRef.current = null;
    }

    const arrivedAt = currentRide?.arrivedAt;
    const status = currentRide?.status;

    if (status === 'ongoing') {
      setDriverStatus(DRIVER_STATUS.ONGOING);
      return;
    }

    if (!arrivedAt) {
      setDriverStatus(DRIVER_STATUS.APPROACHING);
      return;
    }

    const elapsed = Date.now() - arrivedAt;
    const remaining = BOARDING_DISPLAY_DELAY_MS - elapsed;

    if (remaining <= 0) {
      setDriverStatus(DRIVER_STATUS.BOARDING);
    } else {
      setDriverStatus(DRIVER_STATUS.ARRIVED);
      boardingTimerRef.current = setTimeout(() => {
        setDriverStatus(DRIVER_STATUS.BOARDING);
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

  const isOngoing = localStatus === 'ongoing';
  const target = isOngoing ? currentRide.destination : currentRide.origin;
  const targetLat = target?.coordinates?.[1] || target?.latitude;
  const targetLng = target?.coordinates?.[0] || target?.longitude;

  const distanceToTarget = useMemo(() => {
    return calculateDistanceInMeters(
      effectiveLocation?.latitude,
      effectiveLocation?.longitude,
      targetLat,
      targetLng
    );
  }, [effectiveLocation, targetLat, targetLng]);

  const bannerConfig = BANNER_CONFIG[driverStatus] || BANNER_CONFIG[DRIVER_STATUS.APPROACHING];

  const isApproaching = driverStatus === DRIVER_STATUS.APPROACHING;
  const distanceLabel = isApproaching && distanceToTarget !== Infinity
    ? `Validation automatique a proximite (${Math.round(distanceToTarget)}m)`
    : bannerConfig.subLabel || null;

  const handleCallRider = () => {
    const phoneUrl = `tel:${currentRide.riderPhone || '0000000000'}`;
    Linking.openURL(phoneUrl).catch(() => {
      dispatch(showErrorToast({ title: 'Erreur', message: "Impossible de lancer l'appel." }));
    });
  };

  const handleOpenGPS = (forcedCoords = null) => {
    const lat = forcedCoords ? forcedCoords.lat : targetLat;
    const lng = forcedCoords ? forcedCoords.lng : targetLng;
    const isDest = forcedCoords ? true : isOngoing;

    if (!lat || !lng) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Destination introuvable.' }));
      return;
    }

    const label = encodeURIComponent(isDest ? 'Destination Yely' : 'Client Yely');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });

    Linking.openURL(url).catch(() => {
      Linking.openURL(`http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}`);
    });
  };

  return (
    <>
      <Modal visible={showNavModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={50} color={THEME.COLORS.success} />
            </View>

            <Text style={styles.modalTitle}>Course Acceptee</Text>
            <Text style={styles.modalSubtitle}>
              Le client vous attend au point de rendez-vous. Voulez-vous lancer le GPS externe ?
            </Text>

            <TouchableOpacity
              style={styles.modalGpsButton}
              onPress={() => { setShowNavModal(false); handleOpenGPS(); }}
            >
              <Ionicons name="navigate" size={20} color={THEME.COLORS.background} style={{ marginRight: 8 }} />
              <Text style={styles.modalGpsButtonText}>Lancer le GPS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalDismissButton}
              onPress={() => setShowNavModal(false)}
            >
              <Text style={styles.modalDismissText}>Je connais l'endroit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Animated.View style={[styles.container, { paddingBottom: insets.bottom + 10 }, animatedStyle]}>

        <View style={styles.statusBanner}>
          <View style={styles.statusIndicator}>
            <View style={[styles.dot, bannerConfig.dotStyle && styles[bannerConfig.dotStyle]]} />
          </View>
          <Text style={styles.statusText}>
            {isOngoing ? 'Direction Destination' : 'Aller chercher le client'}
          </Text>
        </View>

        <View style={styles.riderInfoCard}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={32} color={THEME.COLORS.champagneGold} />
          </View>

          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>{currentRide.riderName || 'Client Yely'}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={THEME.COLORS.champagneGold} />
              <Text style={styles.ratingText}>Client verifie</Text>
            </View>
          </View>

          <View style={styles.topActionsGroup}>
            {!isOngoing && (
              <TouchableOpacity
                style={styles.pancarteButton}
                onPress={() => navigation.navigate('Pancarte')}
              >
                <Ionicons name="tablet-landscape" size={20} color={THEME.COLORS.champagneGold} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.callButton} onPress={handleCallRider}>
              <Ionicons name="call" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <Ionicons
              name="navigate-circle"
              size={20}
              color={isOngoing ? THEME.COLORS.success : THEME.COLORS.danger}
            />
            <Text style={styles.routeText} numberOfLines={2}>
              {target?.address || 'Adresse de rencontre'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsWrapper}>
          {!isOngoing && (
            <TouchableOpacity style={styles.secondaryGpsButton} onPress={() => handleOpenGPS(null)}>
              <Ionicons name="map" size={18} color={THEME.COLORS.textSecondary} />
              <Text style={styles.secondaryGpsText}>Ouvrir GPS Externe</Text>
            </TouchableOpacity>
          )}

          <View style={[
            styles.passiveStatusContainer,
            bannerConfig.containerStyle && styles[bannerConfig.containerStyle],
          ]}>
            <Text style={styles.passiveStatusTitle}>{bannerConfig.label}</Text>
            {distanceLabel ? (
              <Text style={styles.passiveStatusDistance}>{distanceLabel}</Text>
            ) : null}
          </View>
        </View>

      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: THEME.SPACING.lg },
  modalCard: { width: '100%', backgroundColor: THEME.COLORS.background, borderRadius: 24, padding: THEME.SPACING.xl, alignItems: 'center', elevation: 15 },
  modalIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(46, 204, 113, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: THEME.SPACING.md },
  modalTitle: { fontSize: 22, fontWeight: '900', color: THEME.COLORS.textPrimary, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: THEME.COLORS.textSecondary, textAlign: 'center', marginBottom: THEME.SPACING.xl, lineHeight: 20 },
  modalGpsButton: { flexDirection: 'row', backgroundColor: THEME.COLORS.champagneGold, width: '100%', paddingVertical: 16, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: THEME.SPACING.md, elevation: 4 },
  modalGpsButtonText: { color: THEME.COLORS.background, fontWeight: '900', fontSize: 16 },
  modalDismissButton: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  modalDismissText: { color: THEME.COLORS.textSecondary, fontWeight: 'bold', fontSize: 15 },
  container: { position: 'absolute', bottom: 0, width: width, backgroundColor: THEME.COLORS.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: THEME.SPACING.lg, paddingTop: THEME.SPACING.md, borderWidth: 1, borderColor: THEME.COLORS.border, elevation: 20, zIndex: 10 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: THEME.SPACING.md },
  statusIndicator: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(212, 175, 55, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: THEME.COLORS.champagneGold },
  dotOngoing: { backgroundColor: THEME.COLORS.success },
  dotArrived: { backgroundColor: THEME.COLORS.info },
  dotBoarding: { backgroundColor: '#9B59B6' },
  statusText: { fontSize: 16, fontWeight: '800', color: THEME.COLORS.textPrimary },
  riderInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface, padding: THEME.SPACING.md, borderRadius: 20, borderWidth: 1, borderColor: THEME.COLORS.border, marginBottom: THEME.SPACING.md },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: THEME.COLORS.champagneGold },
  riderDetails: { flex: 1, marginLeft: THEME.SPACING.md },
  riderName: { fontSize: 17, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 4 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: THEME.COLORS.textSecondary, fontWeight: '600' },
  topActionsGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.COLORS.success, justifyContent: 'center', alignItems: 'center' },
  pancarteButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.COLORS.glassDark, borderWidth: 1, borderColor: THEME.COLORS.champagneGold, justifyContent: 'center', alignItems: 'center' },
  routeContainer: { backgroundColor: THEME.COLORS.glassLight, padding: THEME.SPACING.md, borderRadius: 16, marginBottom: THEME.SPACING.md },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeText: { marginLeft: 8, color: THEME.COLORS.textSecondary, fontSize: 13, flex: 1, fontWeight: '700' },
  actionsWrapper: { gap: THEME.SPACING.sm, marginTop: THEME.SPACING.xs },
  secondaryGpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 20, backgroundColor: THEME.COLORS.glassSurface, borderWidth: 1, borderColor: THEME.COLORS.border },
  secondaryGpsText: { color: THEME.COLORS.textSecondary, fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
  passiveStatusContainer: { width: '100%', backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingVertical: 16, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  passiveStatusOngoing: { backgroundColor: 'rgba(46, 204, 113, 0.1)', borderColor: 'rgba(46, 204, 113, 0.3)' },
  passiveStatusArrived: { backgroundColor: 'rgba(52, 152, 219, 0.1)', borderColor: 'rgba(52, 152, 219, 0.4)' },
  passiveStatusBoarding: { backgroundColor: 'rgba(155, 89, 182, 0.1)', borderColor: 'rgba(155, 89, 182, 0.4)' },
  passiveStatusTitle: { color: THEME.COLORS.textPrimary, fontWeight: '900', fontSize: 15, letterSpacing: 1, marginBottom: 4 },
  passiveStatusDistance: { color: THEME.COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
});

export default DriverRideOverlay;