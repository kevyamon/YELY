// src/screens/home/DriverHome.jsx
// HOME DRIVER NATIF - Orchestrateur Principal (Smart Drive 2.0 & Always Online Force)
// CSCSM Level: Bank Grade

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import GpsTeleporter from '../../components/debug/GpsTeleporter';
import MapCard from '../../components/map/MapCard';
import PoiDetailsModal from '../../components/map/PoiDetailsModal';
import ArrivalConfirmModal from '../../components/ride/ArrivalConfirmModal';
import DriverRequestModal from '../../components/ride/DriverRequestModal';
import DriverRideOverlay from '../../components/ride/DriverRideOverlay';
import GlassCard from '../../components/ui/GlassCard';
import GlobalSkeleton from '../../components/ui/GlobalSkeleton';
import GoldButton from '../../components/ui/GoldButton';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';
import { VerificationBanner, SubscriptionBanner } from '../../components/driver/DriverBanners';

import useDriverLifecycle from '../../hooks/useDriverLifecycle';
import useDriverMapFeatures from '../../hooks/useDriverMapFeatures';
import useGeolocation from '../../hooks/useGeolocation';
import usePoiSocketEvents from '../../hooks/usePoiSocketEvents';
import { Ionicons } from '@expo/vector-icons';
import { useGetSubscriptionStatusQuery } from '../../store/api/subscriptionApiSlice';
import { useGetRideByIdQuery } from '../../store/api/ridesApiSlice';
import { useGetUserProfileQuery } from '../../store/api/usersApiSlice';

import { logout, selectCurrentUser, selectPromoMode, selectSubscriptionStatus, selectIsSubscriptionModalDismissed, updateUserInfo } from '../../store/slices/authSlice';
import { selectCurrentRide, setIncomingRide } from '../../store/slices/rideSlice';
import THEME from '../../theme/theme';
import { isLocationInMafereZone } from '../../utils/mafereZone';

const DriverHome = ({ navigation, route }) => {
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  const rideIdFromParams = route?.params?.rideId;
  const { data: rideData } = useGetRideByIdQuery(rideIdFromParams, {
    skip: !rideIdFromParams || !isFocused,
  });

  useEffect(() => {
    if (rideData?.data || rideData) {
      const formatted = rideData.data || rideData;
      const payload = {
        rideId: formatted._id || formatted.id || formatted.rideId,
        origin: formatted.origin,
        destination: formatted.destination,
        distance: formatted.distance,
        priceOptions: formatted.priceOptions || [],
        type: formatted.type,
        collectionPoints: formatted.collectionPoints || [],
        passengersCount: formatted.passengersCount || formatted.passengers || formatted.seats || 1,
      };
      dispatch(setIncomingRide(payload));
      navigation.setParams({ rideId: undefined });
    }
  }, [rideData, dispatch, navigation]);

  usePoiSocketEvents();

  const [selectedPoi, setSelectedPoi] = useState(null);
  const [simulatedLocation, setSimulatedLocation] = useState(null);

  const [headerHeight, setHeaderHeight] = useState(140);
  const [footerHeight, setFooterHeight] = useState(280);

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const subStatusRedux = useSelector(selectSubscriptionStatus); 
  const promoMode = useSelector(selectPromoMode);

  const isRideActive = currentRide && ['accepted', 'arrived', 'in_progress'].includes(currentRide.status);

  const { 
    data: subscriptionData, 
    isLoading: isSubLoading, 
    isFetching, 
    isError: isSubscriptionError,
    refetch: refetchSubscription 
  } = useGetSubscriptionStatusQuery(undefined, { skip: !isFocused });

  const { data: profileResponse, refetch: refetchProfile } = useGetUserProfileQuery(undefined, { skip: !isFocused });

  const subscriptionState = useMemo(() => {
    const apiSubStatus = subscriptionData?.data || subscriptionData || { isActive: false, isPending: false };
    const isLocallyActive = user?.subscription?.isActive === true;

    const isActive = apiSubStatus.isActive === true || isLocallyActive === true || subStatusRedux?.isActive === true;
    const isPending = apiSubStatus.isPending === true || subStatusRedux?.isPending === true;
    
    const isBlockedByVerification = user?.verificationStatus !== 'approved';
    const isSubscriptionBlocked = !isActive && !promoMode?.isActive;
    const isBlocked = !isRideActive && (isSubscriptionBlocked || isBlockedByVerification);

    return { isActive, isPending, isSubscriptionBlocked, isBlocked };
  }, [subscriptionData, user?.subscription?.isActive, user?.verificationStatus, subStatusRedux, promoMode, isRideActive]);

  const { isActive, isPending, isSubscriptionBlocked, isBlocked } = subscriptionState;
  const isSubscriptionModalDismissed = useSelector(selectIsSubscriptionModalDismissed);

  // Synchronisation en temps réel des infos de l'utilisateur (identités + abonnements)
  useEffect(() => {
    if (profileResponse?.data) {
      dispatch(updateUserInfo(profileResponse.data));
    }
  }, [profileResponse, dispatch]);

  useEffect(() => {
    // Sécurité Senior : Ne pas rediriger tant que les configurations de démarrage (Promo VIP / Abonnement) chargent
    if (promoMode === null || isSubLoading) return;

    if (isFocused && !isSubscriptionModalDismissed) {
      if (isSubscriptionBlocked) {
        if (isPending) {
          navigation.navigate('WaitSubscription');
        } else if (subStatusRedux?.isRejected) {
          navigation.navigate('PaymentFailure');
        } else {
          navigation.navigate('Subscription');
        }
      }
    }
  }, [isFocused, isSubscriptionBlocked, isPending, subStatusRedux?.isRejected, isSubscriptionModalDismissed, promoMode, isSubLoading, navigation]);



  useEffect(() => {
    if (isFocused) {
      refetchSubscription();
      refetchProfile();
    }
  }, [isFocused, refetchSubscription, refetchProfile]);

  const { location, errorMsg } = useGeolocation();
  const effectiveLocation = simulatedLocation || location;

  const isDriverInZone = effectiveLocation ? isLocationInMafereZone(effectiveLocation) : true;

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
    location: effectiveLocation, 
    simulatedLocation,
    setSimulatedLocation,
    isDriverInZone, 
    mapRef, 
    errorMsg, 
    isRideActive, 
    isDisabled: isSubscriptionLoading ? false : isBlocked 
  });

  const handleToggleOrRedirect = () => {
    if (isBlocked) {
      if (isBlockedByVerification) {
        navigation.navigate('Profile');
      } else {
        const { setSubscriptionModalDismissed } = require('../../store/slices/authSlice');
        dispatch(setSubscriptionModalDismissed(false));
        if (isPending) {
          navigation.navigate('WaitSubscription');
        } else if (subStatusRedux?.isRejected) {
          navigation.navigate('PaymentFailure');
        } else {
          navigation.navigate('Subscription');
        }
      }
    } else {
      handleToggleAvailability();
    }
  };

  const { mapMarkers, mapTopPadding, mapBottomPadding } = useDriverMapFeatures(
    currentRide, 
    isRideActive,
    headerHeight,
    footerHeight
  );

  const handleHeaderLayout = (event) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) setHeaderHeight(height);
  };

  const handleFooterLayout = (event) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) setFooterHeight(height);
  };



  return (
    <View style={styles.screenWrapper}>
      
      <GpsTeleporter 
        currentRide={currentRide} 
        realLocation={location} 
        simulatedLocation={simulatedLocation} 
        setSimulatedLocation={setSimulatedLocation} 
        mapRef={mapRef}
      />

      <View style={styles.mapContainer}>
        <MapCard
          ref={mapRef}
          isDriver={true} 
          rideStatus={currentRide?.status} 
          location={effectiveLocation}
          driverLocation={effectiveLocation}
          showUserMarker={false} 
          showRecenterButton={true}
          floating={false}
          markers={mapMarkers}
          mapTopPadding={mapTopPadding}
          mapBottomPadding={mapBottomPadding || 240}
          onMarkerPress={(poi) => {
            if (!isRideActive) {
              setSelectedPoi(poi);
            }
          }}
        />
        
        {!effectiveLocation && (
          <View style={styles.floatingLoader}>
            <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
            <Text style={styles.floatingLoaderText}>Synchronisation GPS...</Text>
          </View>
        )}
      </View>

      <View style={styles.headerWrapper} pointerEvents="box-none" onLayout={handleHeaderLayout}>
        <SmartHeader
          scrollY={scrollY}
          address={currentAddress || "Recherche..."}
          userName={user?.name?.split(' ')[0] || 'Chauffeur'}
          onMenuPress={() => {
            requestAnimationFrame(() => {
              navigation.navigate('Menu');
            });
          }}
          onNotificationPress={() => {
            requestAnimationFrame(() => {
              navigation.navigate('Notifications');
            });
          }}
          onShoppingPress={() => {
            requestAnimationFrame(() => {
              navigation.navigate('MarketplaceHub');
            });
          }}
        />
        <SubscriptionBanner 
          isActive={isActive}
          promoMode={promoMode}
          isPending={isPending}
          subStatusRedux={subStatusRedux}
          navigation={navigation}
          dispatch={dispatch}
        />
        <VerificationBanner 
          user={user}
          navigation={navigation}
        />
      </View>

      <View style={styles.footerWrapper} pointerEvents="box-none" onLayout={handleFooterLayout}>
        {isRideActive ? (
          <DriverRideOverlay />
        ) : (
          <SmartFooter 
            isAvailable={isAvailable} 
            isToggling={isToggling}
            onToggleAvailability={handleToggleOrRedirect}
            isBlocked={isBlocked}
            isBlockedByVerification={isBlockedByVerification}
            promoMode={promoMode}
          />
        )}
      </View>

      {!isBlocked && (
        <>
          <DriverRequestModal />
          
          <ArrivalConfirmModal 
            visible={isArrivalModalVisible}
            onConfirm={handleConfirmArrival}
            onSnooze={handleSnoozeArrival}
            isLoading={isCompletingRide}
          />
        </>
      )}

      <PoiDetailsModal
        visible={!!selectedPoi}
        poi={selectedPoi}
        onClose={() => setSelectedPoi(null)}
        readOnly={true} 
      />
      


    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, flex: 1, zIndex: 1 },
  headerWrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  footerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  floatingLoader: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  floatingLoaderText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 12, fontWeight: '600' }
});

export default DriverHome;