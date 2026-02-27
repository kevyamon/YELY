// src/components/ride/RiderRideOverlay.jsx
// PANNEAU PASSAGER - Suivi du Chauffeur & Radar Dynamique
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { selectCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import RatingModal from './RatingModal';

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

const formatDistance = (meters) => {
  if (meters === Infinity) return 'Calcul...';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

const RiderRideOverlay = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const currentRide = useSelector(selectCurrentRide);
  
  const [showRating, setShowRating] = useState(false);
  const translateY = useSharedValue(300);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
  }, [translateY]);

  useEffect(() => {
    if (currentRide && currentRide.status === 'completed') {
      setShowRating(true);
    }
  }, [currentRide?.status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!currentRide) return null;

  const isOngoing = currentRide.status === 'ongoing';
  const isCompleted = currentRide.status === 'completed';

  const driverLat = currentRide?.driverLocation?.coordinates?.[1] || currentRide?.driverLocation?.latitude;
  const driverLng = currentRide?.driverLocation?.coordinates?.[0] || currentRide?.driverLocation?.longitude;

  const target = isOngoing ? currentRide.destination : currentRide.origin;
  const targetLat = target?.coordinates?.[1] || target?.latitude;
  const targetLng = target?.coordinates?.[0] || target?.longitude;

  const liveDistance = useMemo(() => {
    return calculateDistanceInMeters(driverLat, driverLng, targetLat, targetLng);
  }, [driverLat, driverLng, targetLat, targetLng]);

  const handleCallDriver = () => {
    const phoneUrl = `tel:${currentRide.driverPhone || '0000000000'}`;
    Linking.openURL(phoneUrl).catch(() => {
       dispatch(showErrorToast({ title: "Erreur", message: "Impossible de lancer l'appel." }));
    });
  };

  const handleCloseRating = () => {
    setShowRating(false);
  };

  return (
    <>
      {!isCompleted && (
        <Animated.View style={[styles.container, { paddingBottom: insets.bottom + 10 }, animatedStyle]}>
          
          <View style={styles.statusBanner}>
            <View style={styles.statusIndicator}>
               <View style={[styles.dot, isOngoing && styles.dotOngoing]} />
            </View>
            <Text style={styles.statusText}>
              {isOngoing 
                ? `Trajet en cours (${formatDistance(liveDistance)})` 
                : `En approche (${formatDistance(liveDistance)})`}
            </Text>
          </View>

          <View style={styles.driverInfoCard}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color={THEME.COLORS.champagneGold} />
            </View>
            
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{currentRide.driverName || 'Chauffeur Assigné'}</Text>
              <View style={styles.carBadge}>
                <Text style={styles.carText}>Véhicule Confirmé</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <Ionicons name="location" size={16} color={THEME.COLORS.textSecondary} />
              <Text style={styles.routeText} numberOfLines={1}>{currentRide.origin?.address || 'Point de départ'}</Text>
            </View>
            <View style={styles.routeDots} />
            <View style={styles.routeRow}>
              <Ionicons name="flag" size={16} color={THEME.COLORS.danger} />
              <Text style={styles.routeText} numberOfLines={1}>{currentRide.destination?.address || 'Destination'}</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Montant Final</Text>
              <Text style={styles.priceValue}>{currentRide.proposedPrice || currentRide.price} F</Text>
            </View>
          </View>

        </Animated.View>
      )}

      {isCompleted && (
        <RatingModal 
          visible={showRating} 
          rideId={currentRide._id} 
          driverName={currentRide.driverName}
          onClose={handleCloseRating} 
        />
      )}
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
  }
});

export default RiderRideOverlay;