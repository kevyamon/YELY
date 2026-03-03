// src/screens/home/DriverHome.jsx
// HOME DRIVER - Vue Modulaire (Logique deportee) & Bouclier Abonnement
// CSCSM Level: Bank Grade

import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import GpsTeleporter from '../../components/debug/GpsTeleporter';
import MapCard from '../../components/map/MapCard';
import ArrivalConfirmModal from '../../components/ride/ArrivalConfirmModal';
import DriverRequestModal from '../../components/ride/DriverRequestModal';
import DriverRideOverlay from '../../components/ride/DriverRideOverlay';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useDriverLifecycle from '../../hooks/useDriverLifecycle';
import useDriverMapFeatures from '../../hooks/useDriverMapFeatures';
import useGeolocation from '../../hooks/useGeolocation';
import { useGetSubscriptionStatusQuery } from '../../store/api/subscriptionApiSlice';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCurrentRide } from '../../store/slices/rideSlice';
import THEME from '../../theme/theme';
import { isLocationInMafereZone } from '../../utils/mafereZone';

const DriverHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);
  const isFocused = useIsFocused();

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);

  const { 
    data: subscriptionData, 
    isLoading: isSubscriptionLoading, 
    refetch: refetchSubscription 
  } = useGetSubscriptionStatusQuery(undefined, {
    skip: !isFocused 
  });

  const subscriptionStatus = subscriptionData?.data || { isActive: false, isPending: false };
  const isBlocked = !subscriptionStatus.isActive;

  useEffect(() => {
    if (isFocused) {
      refetchSubscription();
    }
  }, [isFocused, refetchSubscription]);

  const { location: realLocation, errorMsg } = useGeolocation();
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const location = simulatedLocation || realLocation;

  const isDriverInZone = isLocationInMafereZone(location);
  const isRideActive = currentRide && ['accepted', 'arrived', 'in_progress'].includes(currentRide.status);

  const {
    isAvailable,
    currentAddress,
    isToggling,
    handleToggleAvailability,
    isArrivalModalVisible,
    isCompletingRide,
    handleConfirmArrival,
    handleSnoozeArrival
  } = useDriverLifecycle({
    user,
    currentRide,
    location,
    simulatedLocation,
    setSimulatedLocation,
    isDriverInZone,
    mapRef,
    errorMsg,
    isRideActive,
    isDisabled: isBlocked
  });

  const { mapMarkers, mapBottomPadding } = useDriverMapFeatures(currentRide, isRideActive);

  const renderSubscriptionBlocker = () => {
    if (isSubscriptionLoading) {
      return (
        <View style={styles.blockerOverlay}>
          <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
          <Text style={styles.blockerText}>Vérification des accès...</Text>
        </View>
      );
    }

    if (!isBlocked) return null;

    return (
      <View style={styles.blockerOverlay}>
        <GlassCard style={styles.blockerCard}>
          {subscriptionStatus.isPending ? (
            <>
              <Text style={styles.blockerTitle}>Vérification en cours</Text>
              <Text style={styles.blockerDesc}>
                Votre paiement a été reçu. Un administrateur valide votre accès.
              </Text>
              <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} style={{ marginTop: 20 }} />
            </>
          ) : (
            <>
              <Text style={styles.blockerTitle}>Accès Expiré</Text>
              <Text style={styles.blockerDesc}>
                Votre abonnement est arrivé à terme. Vous ne pouvez plus recevoir de requêtes de passagers.
              </Text>
              <GoldButton 
                title="Renouveler mon abonnement" 
                onPress={() => navigation.navigate('Subscription')} 
                style={{ width: '100%' }}
              />
            </>
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.mapContainer}>
        {location ? (
          <MapCard
            ref={mapRef}
            location={location}
            driverLocation={location}
            showUserMarker={false}
            showRecenterButton={true}
            floating={false}
            markers={mapMarkers}
            recenterBottomPadding={mapBottomPadding}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
            <Text style={styles.loadingText}>Acquisition du signal GPS...</Text>
          </View>
        )}
      </View>

      <SmartHeader
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.name?.split(' ')[0] || 'Chauffeur'}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {renderSubscriptionBlocker()}

      {!isBlocked && (
        <>
          <GpsTeleporter
            currentRide={currentRide}
            realLocation={realLocation}
            simulatedLocation={simulatedLocation}
            setSimulatedLocation={setSimulatedLocation}
          />

          {isRideActive ? (
            <DriverRideOverlay />
          ) : (
            <SmartFooter
              isAvailable={isAvailable}
              onToggle={handleToggleAvailability}
              isToggling={isToggling}
            />
          )}

          <DriverRequestModal />

          <ArrivalConfirmModal 
            visible={isArrivalModalVisible}
            onConfirm={handleConfirmArrival}
            onSnooze={handleSnoozeArrival}
            isLoading={isCompletingRide}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, flex: 1, zIndex: 1 },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark,
  },
  loadingText: { marginTop: 10, fontSize: 12, color: THEME.COLORS.textSecondary },
  
  blockerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.COLORS.glassDark,
    zIndex: 100, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blockerCard: {
    padding: 30,
    width: '100%',
    alignItems: 'center',
  },
  blockerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  blockerDesc: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  blockerText: {
    color: THEME.COLORS.textPrimary || '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  }
});

export default DriverHome;