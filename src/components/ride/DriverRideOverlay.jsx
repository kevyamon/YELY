// src/components/ride/DriverRideOverlay.jsx
// PANNEAU CHAUFFEUR - Guidage, Interstitial GPS & État Optimiste Local
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import useGeolocation from '../../hooks/useGeolocation';
import { useCompleteRideMutation, useStartRideMutation } from '../../store/api/ridesApiSlice';
import { selectCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; 
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

const DriverRideOverlay = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const currentRide = useSelector(selectCurrentRide);
  const { location } = useGeolocation();
  
  const [startRide, { isLoading: isStarting }] = useStartRideMutation();
  const [completeRide, { isLoading: isCompleting }] = useCompleteRideMutation();
  
  const [localStatus, setLocalStatus] = useState(currentRide?.status);
  const [showNavModal, setShowNavModal] = useState(currentRide?.status === 'accepted');
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
  }, [currentRide?.status]);

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
      location?.latitude, location?.longitude,
      targetLat, targetLng
    );
  }, [location, targetLat, targetLng]);

  const isNearTarget = distanceToTarget <= 50; 
  const isProcessing = isStarting || isCompleting;

  const handleCallRider = () => {
    const phoneUrl = `tel:${currentRide.riderPhone || '0000000000'}`;
    Linking.openURL(phoneUrl).catch(() => {
       dispatch(showErrorToast({ title: "Erreur", message: "Impossible de lancer l'appel." }));
    });
  };

  const handleOpenGPS = (forcedCoords = null) => {
    const lat = forcedCoords ? forcedCoords.lat : targetLat;
    const lng = forcedCoords ? forcedCoords.lng : targetLng;
    const isDest = forcedCoords ? true : isOngoing;

    if (!lat || !lng) {
      dispatch(showErrorToast({ title: "Erreur", message: "Destination introuvable." }));
      return;
    }

    const label = encodeURIComponent(isDest ? "Destination Yely" : "Client Yely");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });

    Linking.openURL(url).catch(() => {
       Linking.openURL(`http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}`);
    });
  };

  const handleAcceptGps = () => {
    setShowNavModal(false);
    handleOpenGPS();
  };

  const handlePrimaryAction = async () => {
    if (!isNearTarget && !isOngoing) {
      dispatch(showErrorToast({ 
        title: "Action bloquee", 
        message: "Veuillez vous rapprocher du point de rendez-vous pour prendre le client en charge." 
      }));
      return;
    }

    const targetRideId = currentRide._id || currentRide.rideId || currentRide.id;

    if (!targetRideId) {
      dispatch(showErrorToast({ title: "Erreur systeme", message: "L'identifiant de la course est introuvable." }));
      return;
    }

    try {
      if (!isOngoing) {
        setLocalStatus('ongoing');
        
        await startRide({ rideId: targetRideId }).unwrap();
        
        const destLat = currentRide.destination?.coordinates?.[1] || currentRide.destination?.latitude;
        const destLng = currentRide.destination?.coordinates?.[0] || currentRide.destination?.longitude;
        handleOpenGPS({ lat: destLat, lng: destLng });
        
      } else {
        await completeRide({ rideId: targetRideId }).unwrap();
      }
    } catch (error) {
      setLocalStatus(currentRide.status);
      dispatch(showErrorToast({ 
        title: "Erreur", 
        message: error?.data?.message || "Action impossible. Veuillez reessayer." 
      }));
    }
  };

  const openPancarte = () => {
    navigation.navigate('Pancarte');
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
              Le client vous attend au point de rendez-vous. Voulez-vous lancer le GPS externe pour vous y rendre ?
            </Text>

            <TouchableOpacity style={styles.modalGpsButton} onPress={handleAcceptGps}>
              <Ionicons name="navigate" size={20} color={THEME.COLORS.background} style={{ marginRight: 8 }} />
              <Text style={styles.modalGpsButtonText}>Lancer le GPS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalDismissButton} onPress={() => setShowNavModal(false)}>
              <Text style={styles.modalDismissText}>Je connais l'endroit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <Text style={styles.riderName}>{currentRide.riderName || 'Client Yely'}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={THEME.COLORS.champagneGold} />
              <Text style={styles.ratingText}>Client verifie</Text>
            </View>
          </View>

          <View style={styles.topActionsGroup}>
            {!isOngoing && (
              <TouchableOpacity style={styles.pancarteButton} onPress={openPancarte}>
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
            <Ionicons name="navigate-circle" size={20} color={isOngoing ? THEME.COLORS.success : THEME.COLORS.danger} />
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

          <TouchableOpacity 
            style={[
              styles.primaryActionButton, 
              (isProcessing || (!isOngoing && !isNearTarget)) && styles.primaryActionButtonDisabled,
              isOngoing && styles.primaryActionButtonOngoing
            ]} 
            onPress={handlePrimaryAction}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionText}>
              {isProcessing ? "TRAITEMENT..." : (isOngoing ? "TERMINER LA COURSE" : "CLIENT A BORD")}
            </Text>
          </TouchableOpacity>
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
  primaryActionButton: { width: '100%', backgroundColor: THEME.COLORS.textPrimary, paddingVertical: 18, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  primaryActionButtonOngoing: { backgroundColor: THEME.COLORS.danger },
  primaryActionButtonDisabled: { backgroundColor: THEME.COLORS.glassDark, opacity: 0.5 },
  primaryActionText: { color: THEME.COLORS.background, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
});

export default DriverRideOverlay;