// src/components/ride/RiderRideOverlay.jsx
// PANNEAU PASSAGER - Suivi du Chauffeur en Temps Réel
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { useCancelRideMutation } from '../../store/api/ridesApiSlice';
import { clearCurrentRide, selectCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

const RiderRideOverlay = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const currentRide = useSelector(selectCurrentRide);
  
  const [cancelRideApi] = useCancelRideMutation();
  const translateY = useSharedValue(300);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
  }, [translateY]);

  if (!currentRide) return null;

  const handleCancel = async () => {
    try {
      await cancelRideApi({ 
        rideId: currentRide.rideId, 
        reason: "Annulé manuellement par le passager en cours d'approche" 
      }).unwrap();
      dispatch(clearCurrentRide());
    } catch (error) {
      dispatch(showErrorToast({ title: "Erreur", message: "Impossible d'annuler la course." }));
    }
  };

  const handleCallDriver = () => {
    const phoneUrl = `tel:${currentRide.driverPhone || '0000000000'}`;
    Linking.openURL(phoneUrl).catch(() => {
       dispatch(showErrorToast({ title: "Erreur", message: "Impossible de lancer l'appel." }));
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isOngoing = currentRide.status === 'ongoing';

  return (
    <Animated.View style={[styles.container, { paddingBottom: insets.bottom + 10 }, animatedStyle]}>
      
      <View style={styles.statusBanner}>
        <View style={styles.statusIndicator}>
           <View style={[styles.dot, isOngoing && styles.dotOngoing]} />
        </View>
        <Text style={styles.statusText}>
          {isOngoing ? "Le chauffeur est arrivé !" : "Le chauffeur est en route"}
        </Text>
      </View>

      <View style={styles.driverInfoCard}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={32} color={THEME.COLORS.champagneGold} />
        </View>
        
        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>{currentRide.driverName || 'Chauffeur Yély'}</Text>
          <View style={styles.carBadge}>
            <Text style={styles.carText}>Toyota Corolla • Grise</Text>
          </View>
          <Text style={styles.plateText}>CI-1234-XY</Text>
        </View>

        <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
          <Ionicons name="call" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <Ionicons name="location" size={16} color={THEME.COLORS.textSecondary} />
          <Text style={styles.routeText} numberOfLines={1}>{currentRide.origin || 'Votre position'}</Text>
        </View>
        <View style={styles.routeDots} />
        <View style={styles.routeRow}>
          <Ionicons name="flag" size={16} color={THEME.COLORS.danger} />
          <Text style={styles.routeText} numberOfLines={1}>{currentRide.destination || 'Destination'}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Tarif convenu</Text>
          <Text style={styles.priceValue}>{currentRide.proposedPrice || currentRide.price} F</Text>
        </View>

        {!isOngoing && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Annuler la course</Text>
          </TouchableOpacity>
        )}
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.COLORS.champagneGold,
  },
  dotOngoing: {
    backgroundColor: THEME.COLORS.success,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
  },
  driverInfoCard: {
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.COLORS.glassDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.COLORS.champagneGold,
  },
  driverDetails: {
    flex: 1,
    marginLeft: THEME.SPACING.md,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginBottom: 4,
  },
  carBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
  },
  carText: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    fontWeight: '600',
  },
  plateText: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.COLORS.champagneGold,
    letterSpacing: 1,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  routeContainer: {
    backgroundColor: THEME.COLORS.glassLight,
    padding: THEME.SPACING.md,
    borderRadius: 16,
    marginBottom: THEME.SPACING.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    marginLeft: 8,
    color: THEME.COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  routeDots: {
    height: 12,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: THEME.COLORS.textTertiary,
    marginLeft: 7,
    marginVertical: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: THEME.SPACING.sm,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  cancelButtonText: {
    color: THEME.COLORS.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RiderRideOverlay;