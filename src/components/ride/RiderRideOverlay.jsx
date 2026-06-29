// src/components/ride/RiderRideOverlay.jsx
// PANNEAU PASSAGER - Suivi du Chauffeur avec Zero-Latency UI (Synchronise Smart Drive 2.0)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { selectCurrentRide } from '../../store/slices/rideSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { startCall } from '../../store/slices/callSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import socketService from '../../services/socketService';
import THEME from '../../theme/theme';
import { calculateDistanceInMeters, formatDistance } from '../../utils/distanceUtils';
import RideRouteDisplay from './RideRouteDisplay';

const { width } = Dimensions.get('window');

const RIDER_STATUS = {
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
};

const RiderRideOverlay = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const currentRide = useSelector(selectCurrentRide);
  const currentUser = useSelector(selectCurrentUser);

  const [riderStatus, setRiderStatus] = useState(RIDER_STATUS.APPROACHING);

  const translateY = useSharedValue(300);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
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

  const toggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    if (nextLocked) {
      cancelMinimizeTimer();
    } else {
      startMinimizeTimer();
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
    const status = currentRide?.status;

    let newStatus = RIDER_STATUS.APPROACHING;
    if (status === 'in_progress') {
      newStatus = RIDER_STATUS.IN_PROGRESS;
    } else if (status === 'arrived') {
      newStatus = RIDER_STATUS.ARRIVED;
    }

    if (newStatus !== riderStatus) {
      setRiderStatus(newStatus);
      setIsMinimized(false);
      translateY.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.exp),
      });
      startMinimizeTimer();
    }
  }, [currentRide?.status, riderStatus]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isOngoing = riderStatus === RIDER_STATUS.IN_PROGRESS;

  const driverLat =
    currentRide?.driverLocation?.coordinates?.[1] ||
    currentRide?.driverLocation?.latitude;
  const driverLng =
    currentRide?.driverLocation?.coordinates?.[0] ||
    currentRide?.driverLocation?.longitude;

  const target = isOngoing ? currentRide?.destination : currentRide?.origin;
  const targetLat = target?.coordinates?.[1] || target?.latitude;
  const targetLng = target?.coordinates?.[0] || target?.longitude;

  const liveDistance = useMemo(() => {
    if (!currentRide) return Infinity;
    return calculateDistanceInMeters(driverLat, driverLng, targetLat, targetLng);
  }, [currentRide, driverLat, driverLng, targetLat, targetLng]);

  if (!currentRide) return null;

  // SUPPRESSION ARCHITECTURALE : Le passager ne force plus l'etat "arrived" localement. 
  // Il fait confiance absolue au Smart Drive 2.0 du chauffeur et au backend.

  const resolveStatusLabel = () => {
    switch (riderStatus) {
      case RIDER_STATUS.ARRIVED:
        return 'Chauffeur sur place. Montez a bord.'; // UX adaptee a l'auto-start
      case RIDER_STATUS.IN_PROGRESS:
        return 'En route vers la destination';
      default:
        return `En approche (${formatDistance(liveDistance)})`;
    }
  };

  const resolveDotStyle = () => {
    switch (riderStatus) {
      case RIDER_STATUS.ARRIVED:
        return styles.dotArrived;
      case RIDER_STATUS.IN_PROGRESS:
        return styles.dotOngoing;
      default:
        return null;
    }
  };

  const handleCallDriver = () => {
    const driverId = currentRide.driver?._id || currentRide.driver || currentRide.driverId;
    if (!driverId) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Chauffeur introuvable pour l\'appel.' }));
      return;
    }
    
    const payload = {
      targetUserId: driverId.toString(),
      targetName: driverName,
      targetAvatar: driverAvatar || '',
      targetPhone: currentRide.driverPhone || currentRide.driver?.phone || 'Masqué',
    };
    
    socketService.emit('voice_call_request', {
      targetUserId: payload.targetUserId,
      callerName: currentUser?.name || 'Client',
      callerAvatar: currentUser?.profilePicture || '',
      callerPhone: currentUser?.phone || 'Masqué',
      rideId: currentRide._id || currentRide.id || currentRide.rideId
    });
    
    dispatch(startCall(payload));
  };

  const driverAvatar = currentRide.driverProfilePicture || currentRide.driverAvatar || currentRide.driver?.profilePicture || currentRide.driver?.avatar;
  const driverName = currentRide.driverName || currentRide.driver?.name || 'Chauffeur Assigne';
  const hasPlate = !!(currentRide?.vehicle?.plate && currentRide?.vehicle?.plate !== 'NON SPECIFIE');
  const hasModel = !!(currentRide?.vehicle?.model && currentRide?.vehicle?.model !== 'Vehicule');

  return (
    <>
      <Animated.View 
        style={[styles.container, { paddingBottom: insets.bottom + 10 }, animatedStyle]}
        onTouchStart={startMinimizeTimer}
      >

        {/* Poignee de tiroir / Masquage & Verrouillage */}
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
            style={[
              styles.lockButton,
              isLocked && styles.lockButtonActive
            ]} 
            onPress={toggleLock}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isLocked ? "lock-closed" : "lock-open-outline"} 
              size={12} 
              color={isLocked ? '#121418' : THEME.COLORS.champagneGold} 
            />
            <Text style={[styles.lockButtonText, isLocked && styles.lockButtonTextActive]}>
              {isLocked ? "Verrouillé" : "Épingler"}
            </Text>
          </TouchableOpacity>
        </View>

      <View style={styles.statusBanner}>
        <View style={styles.statusIndicator}>
          <View style={[styles.dot, resolveDotStyle()]} />
        </View>
        <Text style={styles.statusText}>{resolveStatusLabel()}</Text>
      </View>

      <View style={styles.driverInfoCard}>
        <TouchableOpacity 
          style={styles.avatarPlaceholder} 
          onPress={() => setIsProfileVisible(true)}
          activeOpacity={0.8}
        >
          {driverAvatar ? (
            <Image 
              source={{ uri: driverAvatar }} 
              style={styles.avatarImage} 
            />
          ) : (
            <Ionicons name="person" size={32} color={THEME.COLORS.champagneGold} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.driverDetails} 
          onPress={() => setIsProfileVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.driverName}>
            {driverName}
          </Text>
          <View style={[styles.carBadge, !hasPlate && styles.carBadgeWarning]}>
            <Text style={[styles.carText, !hasPlate && styles.carTextWarning]}>
              {hasPlate ? 'Véhicule immatriculé' : 'Plaque non renseignée'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.topActionsGroup}>
          {!isOngoing && (
            <TouchableOpacity
              style={styles.pancarteButton}
              onPress={() => navigation.navigate('Pancarte')}
            >
              <Ionicons name="tablet-landscape" size={20} color={THEME.COLORS.champagneGold} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
            <Ionicons name="call" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
            {currentRide.proposedPrice || currentRide.price} FCFA
          </Text>
        </View>
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

    <Modal 
      visible={isProfileVisible} 
      transparent={true} 
      animationType="fade"
      onRequestClose={() => setIsProfileVisible(false)}
    >
      <View style={styles.profileModalBackdrop}>
        <View style={styles.profileModalCard}>
          <TouchableOpacity 
            style={styles.profileCloseButton} 
            onPress={() => setIsProfileVisible(false)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.profileAvatarContainer}>
            {driverAvatar ? (
              <Image source={{ uri: driverAvatar }} style={styles.profileAvatarLarge} />
            ) : (
              <Ionicons name="person" size={80} color={THEME.COLORS.champagneGold} />
            )}
          </View>
          
          <Text style={styles.profileName}>{driverName}</Text>
          
          <View style={styles.profileVerifyBadge}>
            <Ionicons name="checkmark-circle" size={16} color={THEME.COLORS.success} style={{ marginRight: 6 }} />
            <Text style={styles.profileVerifyText}>Chauffeur vérifié</Text>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.profileDetailRow}>
            <Ionicons name="car-sport" size={22} color={THEME.COLORS.champagneGold} />
            <View style={styles.profileDetailTexts}>
              <Text style={styles.profileDetailLabel}>Modèle de véhicule</Text>
              <Text style={styles.profileDetailVal}>
                {hasModel ? (
                  `${currentRide?.vehicle?.model} (${currentRide?.vehicle?.color || 'Couleur non renseignée'})`
                ) : (
                  'Modèle non renseigné'
                )}
              </Text>
            </View>
          </View>

          <View style={styles.profileDetailRow}>
            <Ionicons name="barcode" size={22} color={THEME.COLORS.champagneGold} />
            <View style={styles.profileDetailTexts}>
              <Text style={styles.profileDetailLabel}>Plaque d'immatriculation</Text>
              {hasPlate ? (
                <View style={styles.profilePlateBadge}>
                  <Text style={styles.profilePlateText}>
                    {currentRide?.vehicle?.plate}
                  </Text>
                </View>
              ) : (
                <View style={[styles.profilePlateBadge, styles.profilePlateBadgeMissing]}>
                  <Text style={[styles.profilePlateText, styles.profilePlateTextMissing]}>
                    PLAQUE NON RENSEIGNÉE
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.profileOkButton} 
            onPress={() => setIsProfileVisible(false)}
          >
            <Text style={styles.profileOkButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
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
  statusText: { fontSize: 16, fontWeight: '800', color: THEME.COLORS.textPrimary },
  driverInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassSurface, padding: THEME.SPACING.md, borderRadius: 20, borderWidth: 1, borderColor: THEME.COLORS.border, marginBottom: THEME.SPACING.md },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.COLORS.glassDark, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: THEME.COLORS.champagneGold, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 30 },
  driverDetails: { flex: 1, marginLeft: THEME.SPACING.md },
  driverName: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 4 },
  carBadge: { backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  carBadgeWarning: { backgroundColor: 'rgba(231, 76, 60, 0.08)', borderColor: 'rgba(231, 76, 60, 0.25)' },
  carText: { fontSize: 12, color: THEME.COLORS.textSecondary, fontWeight: '600' },
  carTextWarning: { color: THEME.COLORS.danger },
  callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.COLORS.success, justifyContent: 'center', alignItems: 'center' },
  topActionsGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pancarteButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.COLORS.glassDark, borderWidth: 1, borderColor: THEME.COLORS.champagneGold, justifyContent: 'center', alignItems: 'center' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: THEME.SPACING.sm },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 11, color: THEME.COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' },
  priceValue: { fontSize: 24, fontWeight: '900', color: THEME.COLORS.textPrimary },
  dragHandleContainer: {
    width: '70%',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
  lockButton: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  lockButtonActive: {
    backgroundColor: THEME.COLORS.champagneGold,
    borderColor: THEME.COLORS.champagneGold,
  },
  lockButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.COLORS.champagneGold,
    textTransform: 'uppercase',
  },
  lockButtonTextActive: {
    color: '#121418',
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
  profileModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SPACING.lg,
  },
  profileModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: THEME.COLORS.background,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    padding: THEME.SPACING.xl,
    alignItems: 'center',
    elevation: 20,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  profileCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.COLORS.glassDark,
    borderWidth: 3,
    borderColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: THEME.SPACING.md,
  },
  profileAvatarLarge: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  profileVerifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.2)',
    marginBottom: THEME.SPACING.xl,
  },
  profileVerifyText: {
    fontSize: 12,
    color: THEME.COLORS.success,
    fontWeight: '800',
  },
  profileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: THEME.COLORS.border,
    marginBottom: THEME.SPACING.lg,
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    borderRadius: 16,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.md,
  },
  profileDetailTexts: {
    marginLeft: 12,
    flex: 1,
  },
  profileDetailLabel: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  profileDetailVal: {
    fontSize: 15,
    color: THEME.COLORS.textPrimary,
    fontWeight: '800',
  },
  profilePlateBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: THEME.COLORS.champagneGold,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  profilePlateText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  profilePlateBadgeMissing: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderColor: THEME.COLORS.danger,
    borderWidth: 1.5,
  },
  profilePlateTextMissing: {
    color: THEME.COLORS.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  profileOkButton: {
    backgroundColor: THEME.COLORS.champagneGold,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.SPACING.md,
  },
  profileOkButtonText: {
    color: '#121418',
    fontSize: 16,
    fontWeight: '900',
  },
});

export default RiderRideOverlay;