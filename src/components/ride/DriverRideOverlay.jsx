// src/components/ride/DriverRideOverlay.jsx
// PANNEAU CHAUFFEUR - Guidage et Statuts de Proximite (Interface Allegee Smart Drive)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
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
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { useCompleteRideMutation, useCollectPointMutation } from '../../store/api/ridesApiSlice';
import { updateUserInfo } from '../../store/slices/authSlice';
import { selectCurrentRide, selectEffectiveLocation, updateRideStatus } from '../../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import { calculateDistanceInMeters } from '../../utils/distanceUtils';
import RideRouteDisplay from './RideRouteDisplay';

const { width } = Dimensions.get('window');

const DRIVER_STATUS = {
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
};

const BANNER_CONFIG = {
  [DRIVER_STATUS.APPROACHING]: {
    label: 'EN APPROCHE',
    dotStyle: null,
    containerStyle: null,
  },
  [DRIVER_STATUS.ARRIVED]: {
    label: 'CLIENT A BORD ? ROULEZ',
    dotStyle: 'dotArrived',
    containerStyle: 'passiveStatusArrived',
    subLabel: "La course demarrera automatiquement.",
  },
  [DRIVER_STATUS.IN_PROGRESS]: {
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
  const effectiveLocation = useSelector(selectEffectiveLocation);

  const [localStatus, setLocalStatus] = useState(currentRide?.status);
  const [showNavModal, setShowNavModal] = useState(currentRide?.status === 'accepted');
  const [driverStatus, setDriverStatus] = useState(DRIVER_STATUS.APPROACHING);
  const [isLocked, setIsLocked] = useState(false);

  const [completeRide, { isLoading: isCompleting }] = useCompleteRideMutation();
  const [collectPoint, { isLoading: isCollectingPoint }] = useCollectPointMutation();

  const translateY = useSharedValue(300);
  const pulseScale = useSharedValue(1); 

  const [isMinimized, setIsMinimized] = useState(false);
  const hideTimerRef = useRef(null);

  const startMinimizeTimer = () => {
    if (isLocked) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsMinimized(true);
      translateY.value = withTiming(800, {
        duration: 600,
        easing: Easing.inOut(Easing.ease),
      });
    }, 5000);
  };

  const cancelMinimizeTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
      translateY.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.exp),
      });
      startMinimizeTimer();
    } else {
      setIsMinimized(true);
      translateY.value = withTiming(800, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
      cancelMinimizeTimer();
    }
  };

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
    startMinimizeTimer();
    return () => cancelMinimizeTimer();
  }, [translateY]);

  useEffect(() => {
    if (currentRide?.status && currentRide.status !== localStatus) {
      setLocalStatus(currentRide.status);
      setIsMinimized(false);
      translateY.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.exp),
      });
      startMinimizeTimer();
    }
  }, [currentRide?.status, localStatus]);

  useEffect(() => {
    const status = currentRide?.status;

    if (status === 'in_progress') {
      setDriverStatus(DRIVER_STATUS.IN_PROGRESS);
    } else if (status === 'arrived') {
      setDriverStatus(DRIVER_STATUS.ARRIVED);
    } else {
      setDriverStatus(DRIVER_STATUS.APPROACHING);
    }
  }, [currentRide?.status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isOngoing = localStatus === 'in_progress';
  const isArrived = localStatus === 'arrived';
  
  const target = (isOngoing || isArrived) ? currentRide?.destination : currentRide?.origin;
  const targetLat = target?.coordinates?.[1] || target?.latitude;
  const targetLng = target?.coordinates?.[0] || target?.longitude;

  const distanceToTarget = useMemo(() => {
    if (!currentRide) return Infinity;
    return calculateDistanceInMeters(
      effectiveLocation?.latitude,
      effectiveLocation?.longitude,
      targetLat,
      targetLng
    );
  }, [currentRide, effectiveLocation, targetLat, targetLng]);

  useEffect(() => {
    if (currentRide && isOngoing && distanceToTarget <= 150) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [currentRide, isOngoing, distanceToTarget, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!currentRide) return null;

  const isDelivery = currentRide?.type === 'DELIVERY';

  const bannerConfig = useMemo(() => {
    const base = BANNER_CONFIG[driverStatus] || BANNER_CONFIG[DRIVER_STATUS.APPROACHING];
    if (!isDelivery) return base;

    // Surcharge pour la livraison
    if (driverStatus === DRIVER_STATUS.APPROACHING) {
      return { ...base, label: 'APPROCHE VENDEUR' };
    }
    if (driverStatus === DRIVER_STATUS.ARRIVED) {
      return { ...base, label: 'COLIS RÉCUPÉRÉ ? ROULEZ', subLabel: 'La livraison démarrera automatiquement.' };
    }
    if (driverStatus === DRIVER_STATUS.IN_PROGRESS) {
      return { ...base, label: 'LIVRAISON EN COURS' };
    }
    return base;
  }, [driverStatus, isDelivery]);

  const isApproaching = driverStatus === DRIVER_STATUS.APPROACHING;
  const distanceLabel = isApproaching && distanceToTarget !== Infinity
    ? `Validation automatique à proximité (${Math.round(distanceToTarget)}m)`
    : bannerConfig.subLabel || null;

  const handleCallRider = () => {
    // Si c'est une livraison et qu'on n'a pas encore le colis, on appelle peut-être le vendeur ?
    // Mais par simplicité on garde le contact principal de la course
    const phoneUrl = `tel:${currentRide.riderPhone || '0000000000'}`;
    Linking.openURL(phoneUrl).catch(() => {
      dispatch(showErrorToast({ title: 'Erreur', message: "Impossible de lancer l'appel." }));
    });
  };

  const handleOpenGPS = (forcedCoords = null) => {
    const lat = forcedCoords ? forcedCoords.lat : targetLat;
    const lng = forcedCoords ? forcedCoords.lng : targetLng;

    if (!lat || !lng) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Destination introuvable.' }));
      return;
    }

    // ARCHITECTURE ZERO-CLIC : Lancement direct du mode Navigation (Itineraire trace)
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
    });

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
    });
  };

  const handleManualComplete = async () => {
    if (isCompleting) return;
    try {
      dispatch(updateRideStatus({ status: 'completed' }));
      const rideId = currentRide._id || currentRide.id || currentRide.rideId;
      const res = await completeRide({ rideId }).unwrap();
      
      if (res.data && res.data.stats) {
        dispatch(updateUserInfo({ 
          totalRides: res.data.stats.totalRides,
          totalEarnings: res.data.stats.totalEarnings,
          rating: res.data.stats.rating
        }));
      }
      dispatch(showSuccessToast({ title: 'Course terminée', message: 'Vos gains ont été crédités.' }));
    } catch (err) {
      dispatch(updateRideStatus({ status: 'in_progress' }));
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de clôturer la course.' }));
    }
  };

  const handleCollectPoint = async (sellerId) => {
    try {
      const rideId = currentRide._id || currentRide.id || currentRide.rideId;
      await collectPoint({ rideId, sellerId }).unwrap();
      dispatch(showSuccessToast({ title: 'Collecte validée', message: 'Le point de retrait a été marqué comme collecté.' }));
    } catch (err) {
      dispatch(showErrorToast({ title: 'Erreur', message: err?.data?.message || 'Impossible de valider la collecte.' }));
    }
  };

  return (
    <>
      <Modal visible={showNavModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={50} color={THEME.COLORS.success} />
            </View>

            <Text style={styles.modalTitle}>Course acceptée</Text>
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
              <Text style={styles.modalDismissText}>Continuer sans GPS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Animated.View 
        style={[styles.container, { paddingBottom: insets.bottom + 10 }, animatedStyle]}
        onTouchStart={startMinimizeTimer}
      >

        {/* Poignee de tiroir / Bouton de masquage manuel */}
        <View style={styles.dragHandleWrapper}>
          <TouchableOpacity 
            style={styles.dragHandleContainer} 
            onPress={toggleMinimize}
            activeOpacity={0.7}
          >
            <View style={styles.dragHandle} />
            <Ionicons name="chevron-down" size={16} color={THEME.COLORS.textSecondary} style={styles.dragIcon} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.lockButton} 
            onPress={() => {
              const nextLocked = !isLocked;
              setIsLocked(nextLocked);
              if (nextLocked) {
                cancelMinimizeTimer();
              } else {
                startMinimizeTimer();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isLocked ? "pin" : "pin-outline"} 
              size={18} 
              color={isLocked ? THEME.COLORS.champagneGold : THEME.COLORS.textTertiary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statusBanner}>
          <View style={styles.statusIndicator}>
            <View style={[styles.dot, bannerConfig.dotStyle && styles[bannerConfig.dotStyle]]} />
          </View>
          <Text style={styles.statusText}>
            {isOngoing || isArrived 
              ? (isDelivery ? 'Livraison Client' : 'Direction Destination') 
              : (isDelivery ? 'Récupérer le colis' : 'Aller chercher le client')}
          </Text>
        </View>

        <View style={styles.riderInfoCard}>
          <View style={styles.avatarPlaceholder}>
            {currentRide.riderProfilePicture ? (
              <Image 
                source={{ uri: currentRide.riderProfilePicture }} 
                style={styles.avatarImage} 
              />
            ) : (
              <Ionicons name="person" size={32} color={THEME.COLORS.champagneGold} />
            )}
          </View>

          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>{currentRide.riderName || 'Client Yely'}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={THEME.COLORS.champagneGold} />
              <Text style={styles.ratingText}>Client vérifié</Text>
            </View>
          </View>

          <View style={styles.topActionsGroup}>
            {!isOngoing && !isDelivery && (
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

        {isDelivery && !isOngoing && (
          <View style={styles.checkpointsContainer}>
            <Text style={styles.checkpointsHeader}>Points de collecte vendeur :</Text>
            {currentRide.collectionPoints?.map((item, idx) => {
              const isPointCollected = item.isCollected;
              const sId = item.seller?._id || item.seller;
              
              return (
                <View key={idx} style={[styles.checkpointCard, isPointCollected && styles.checkpointCardCollected]}>
                  <View style={styles.checkpointLeft}>
                    <Ionicons 
                      name={isPointCollected ? "checkmark-circle" : "cube-outline"} 
                      size={20} 
                      color={isPointCollected ? THEME.COLORS.success : THEME.COLORS.champagneGold} 
                    />
                    <View style={styles.checkpointTexts}>
                      <Text style={[styles.checkpointAddress, isPointCollected && styles.checkpointAddressCollected]} numberOfLines={2}>
                        {item.address || 'Adresse vendeur'}
                      </Text>
                      <Text style={[styles.checkpointStatus, isPointCollected && { color: THEME.COLORS.success }]}>
                        {isPointCollected ? 'Collecté' : 'À récupérer'}
                      </Text>
                    </View>
                  </View>
                  
                  {!isPointCollected && (
                    <TouchableOpacity 
                      style={styles.collectButtonAction} 
                      onPress={() => handleCollectPoint(sId)}
                      disabled={isCollectingPoint}
                    >
                      <Text style={styles.collectButtonText}>Valider</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <RideRouteDisplay
          originAddress={currentRide.origin?.address}
          destinationAddress={currentRide.destination?.address}
          showDestination={isOngoing || isArrived}
          variant="driver"
        />

        <View style={styles.actionsWrapper}>
          {(!isOngoing && !isArrived) && (
            <TouchableOpacity style={styles.secondaryGpsButton} onPress={() => handleOpenGPS(null)}>
              <Ionicons name="map" size={18} color={THEME.COLORS.textSecondary} />
              <Text style={styles.secondaryGpsText}>Ouvrir GPS Externe</Text>
            </TouchableOpacity>
          )}

          {isOngoing && distanceToTarget <= 150 ? (
            <>
              <Animated.View style={[styles.passiveStatusContainer, styles.passiveStatusFinishing, pulseStyle]}>
                <Ionicons name="flag" size={24} color={THEME.COLORS.danger} style={{ marginBottom: 4 }} />
                <Text style={[styles.passiveStatusTitle, { color: THEME.COLORS.danger }]}>ARRIVÉE IMMINENTE</Text>
                <Text style={styles.passiveStatusDistance}>Clôture automatique à l'arrêt.</Text>
              </Animated.View>
              
              <TouchableOpacity 
                style={styles.manualCompleteButton} 
                onPress={handleManualComplete}
                disabled={isCompleting}
              >
                <Text style={styles.manualCompleteText}>Terminer plus tôt</Text>
              </TouchableOpacity>
            </>
          ) : isDelivery && !isOngoing ? null : (
            <View style={[
              styles.passiveStatusContainer,
              bannerConfig.containerStyle && styles[bannerConfig.containerStyle],
            ]}>
              <Text style={styles.passiveStatusTitle}>{bannerConfig.label}</Text>
              {distanceLabel ? (
                <Text style={styles.passiveStatusDistance}>{distanceLabel}</Text>
              ) : null}
            </View>
          )}
        </View>

      </Animated.View>

      {isMinimized && (
        <View style={styles.floatingArrowContainer} pointerEvents="box-none">
          <TouchableOpacity 
            style={styles.floatingArrowButton} 
            onPress={toggleMinimize}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-up" size={24} color="#121418" />
          </TouchableOpacity>
        </View>
      )}
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
  statusText: { fontSize: 16, fontWeight: '800', color: THEME.COLORS.textPrimary },
  riderInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface, padding: THEME.SPACING.md, borderRadius: 20, borderWidth: 1, borderColor: THEME.COLORS.border, marginBottom: THEME.SPACING.md },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: THEME.COLORS.champagneGold, overflow: 'hidden' }, 
  avatarImage: { width: '100%', height: '100%', borderRadius: 28 }, 
  riderDetails: { flex: 1, marginLeft: THEME.SPACING.md },
  riderName: { fontSize: 17, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 4 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: THEME.COLORS.textSecondary, fontWeight: '600' },
  topActionsGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.COLORS.success, justifyContent: 'center', alignItems: 'center' },
  pancarteButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.COLORS.glassDark, borderWidth: 1, borderColor: THEME.COLORS.champagneGold, justifyContent: 'center', alignItems: 'center' },
  actionsWrapper: { gap: THEME.SPACING.sm, marginTop: THEME.SPACING.xs },
  secondaryGpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 20, backgroundColor: THEME.COLORS.glassSurface, borderWidth: 1, borderColor: THEME.COLORS.border },
  secondaryGpsText: { color: THEME.COLORS.textSecondary, fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
  passiveStatusContainer: { width: '100%', backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingVertical: 16, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  passiveStatusOngoing: { backgroundColor: 'rgba(46, 204, 113, 0.1)', borderColor: 'rgba(46, 204, 113, 0.3)' },
  passiveStatusArrived: { backgroundColor: 'rgba(52, 152, 219, 0.1)', borderColor: 'rgba(52, 152, 219, 0.4)' },
  passiveStatusFinishing: { backgroundColor: 'rgba(231, 76, 60, 0.1)', borderColor: 'rgba(231, 76, 60, 0.5)', borderWidth: 2 },
  passiveStatusTitle: { color: THEME.COLORS.textPrimary, fontWeight: '900', fontSize: 15, letterSpacing: 1, marginBottom: 4 },
  passiveStatusDistance: { color: THEME.COLORS.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center', paddingHorizontal: 10 },
  manualCompleteButton: { marginTop: THEME.SPACING.sm, paddingVertical: 12, alignItems: 'center', backgroundColor: THEME.COLORS.glassLight, borderRadius: 20, borderWidth: 1, borderColor: THEME.COLORS.border },
  manualCompleteText: { color: THEME.COLORS.textSecondary, fontWeight: 'bold', fontSize: 13 },
  checkpointsContainer: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.md,
  },
  checkpointsHeader: {
    fontSize: 12,
    color: THEME.COLORS.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  checkpointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.glassLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
  },
  checkpointCardCollected: {
    borderColor: 'rgba(40, 167, 69, 0.2)',
    backgroundColor: 'rgba(40, 167, 69, 0.05)',
  },
  checkpointLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  checkpointTexts: {
    marginLeft: 10,
    flex: 1,
  },
  checkpointAddress: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  checkpointAddressCollected: {
    color: THEME.COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  checkpointStatus: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  collectButtonAction: {
    backgroundColor: THEME.COLORS.champagneGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  collectButtonText: {
    color: '#121418',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dragHandleWrapper: {
    width: '100%',
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: -4,
    marginBottom: THEME.SPACING.xs,
  },
  dragHandleContainer: {
    width: '70%',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButton: {
    position: 'absolute',
    right: 16,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.COLORS.border,
    marginBottom: 4,
  },
  dragIcon: {
    marginTop: -2,
  },
  floatingArrowContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  floatingArrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default DriverRideOverlay;