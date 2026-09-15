// src/screens/home/DriverHome.jsx
// HOME DRIVER NATIF - Orchestrateur Principal (Smart Drive 2.0 & Always Online Force)
// CSCSM Level: Bank Grade (Strictement <= 325 lignes, Sans Emojis)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';

import GpsTeleporter from '../../components/debug/GpsTeleporter';
import MapCard from '../../components/map/MapCard';
import PoiDetailsModal from '../../components/map/PoiDetailsModal';
import ArrivalConfirmModal from '../../components/ride/ArrivalConfirmModal';
import DriverRequestModal from '../../components/ride/DriverRequestModal';
import DriverRideOverlay from '../../components/ride/DriverRideOverlay';
import LocationDisclosureModal from '../../components/ride/LocationDisclosureModal';
import SmartHeader from '../../components/ui/SmartHeader';
import SmartFooter from '../../components/ui/SmartFooter';
import { VerificationBanner, SubscriptionBanner } from '../../components/driver/DriverBanners';
import IdentityPromptModal from '../../components/driver/IdentityPromptModal';

import useDriverLifecycle from '../../hooks/useDriverLifecycle';
import useDriverMapFeatures from '../../hooks/useDriverMapFeatures';
import useGeolocation from '../../hooks/useGeolocation';
import usePoiSocketEvents from '../../hooks/usePoiSocketEvents';
import { useGetSubscriptionStatusQuery } from '../../store/api/subscriptionApiSlice';
import { useGetRideByIdQuery } from '../../store/api/ridesApiSlice';
import { useGetUserProfileQuery } from '../../store/api/usersApiSlice';
import { selectCurrentUser, selectPromoMode, selectSubscriptionStatus, selectIsSubscriptionModalDismissed, updateUserInfo } from '../../store/slices/authSlice';
import { selectCurrentRide, setIncomingRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import { isLocationInMafereZone } from '../../utils/mafereZone';

const DriverHome = ({ navigation, route }) => {
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  const rideIdFromParams = route?.params?.rideId;
  const { data: rideData } = useGetRideByIdQuery(rideIdFromParams, { skip: !rideIdFromParams || !isFocused });

  useEffect(() => {
    if (rideData?.data || rideData) {
      const f = rideData.data || rideData;
      dispatch(setIncomingRide({
        rideId: f._id || f.id || f.rideId,
        origin: f.origin,
        destination: f.destination,
        distance: f.distance,
        priceOptions: f.priceOptions || [],
        type: f.type,
        collectionPoints: f.collectionPoints || [],
        passengersCount: f.passengersCount || f.passengers || f.seats || 1,
      }));
      navigation.setParams({ rideId: undefined });
    }
  }, [rideData, dispatch, navigation]);

  usePoiSocketEvents();

  const [selectedPoi, setSelectedPoi] = useState(null);
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const [isDisclosureVisible, setIsDisclosureVisible] = useState(false);
  const [isIdentityPromptDismissed, setIsIdentityPromptDismissed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(140);
  const [footerHeight, setFooterHeight] = useState(280);

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const subStatusRedux = useSelector(selectSubscriptionStatus); 
  const promoMode = useSelector(selectPromoMode);
  const isSubscriptionModalDismissed = useSelector(selectIsSubscriptionModalDismissed);
  const isRideActive = currentRide && ['accepted', 'arrived', 'in_progress'].includes(currentRide.status);

  useEffect(() => {
    const checkBgPerm = async () => {
      try {
        const seen = await AsyncStorage.getItem('@yely_location_disclosure_seen');
        if (!seen) {
          const { status } = await Location.getBackgroundPermissionsAsync();
          if (status !== 'granted') setIsDisclosureVisible(true);
        }
      } catch (_) {}
    };
    if (isFocused && user?.role === 'driver') checkBgPerm();
  }, [isFocused, user?.role]);

  const handleAcceptDisclosure = async () => {
    setIsDisclosureVisible(false);
    try {
      await AsyncStorage.setItem('@yely_location_disclosure_seen', 'true');
      await Location.requestBackgroundPermissionsAsync();
    } catch (_) {}
  };

  const { data: subscriptionData, isLoading: isSubLoading, refetch: refetchSubscription } =
    useGetSubscriptionStatusQuery(undefined, { skip: !isFocused });
  const { data: profileResponse, refetch: refetchProfile } =
    useGetUserProfileQuery(undefined, { skip: !isFocused });

  const subscriptionState = useMemo(() => {
    const apiSubStatus = subscriptionData?.data || subscriptionData || { isActive: false, isPending: false };
    const isLocallyActive = user?.subscription?.isActive === true;
    const isActive = apiSubStatus.isActive === true || isLocallyActive === true || subStatusRedux?.isActive === true;
    const isPending = apiSubStatus.isPending === true || subStatusRedux?.isPending === true;
    const isBlockedByVerification = user?.verificationStatus !== 'approved';
    const isSubscriptionBlocked = !isActive && !promoMode?.isActive;
    const isBlocked = !isRideActive && (isSubscriptionBlocked || isBlockedByVerification);
    return { isActive, isPending, isSubscriptionBlocked, isBlocked, isBlockedByVerification };
  }, [subscriptionData, user?.subscription?.isActive, user?.verificationStatus, subStatusRedux, promoMode, isRideActive]);

  const { isActive, isPending, isSubscriptionBlocked, isBlocked, isBlockedByVerification } = subscriptionState;

  useEffect(() => {
    if (profileResponse?.data) dispatch(updateUserInfo(profileResponse.data));
  }, [profileResponse, dispatch]);

  const isPostPaymentReturn = route?.params?.payment === 'success' || route?.params?.status === 'success';

  useEffect(() => {
    if (promoMode === null || isSubLoading || isPostPaymentReturn) return;
    if (isFocused && !isSubscriptionModalDismissed && isSubscriptionBlocked && !isPending && !isActive) {
      navigation.navigate(subStatusRedux?.isRejected ? 'PaymentFailure' : 'Subscription');
    }
  }, [isFocused, isSubscriptionBlocked, isPending, isActive, subStatusRedux?.isRejected, isSubscriptionModalDismissed, promoMode, isSubLoading, navigation, isPostPaymentReturn]);

  useEffect(() => {
    if (isFocused) {
      refetchSubscription();
      refetchProfile();
    }
  }, [isFocused, refetchSubscription, refetchProfile]);

  const { location, errorMsg } = useGeolocation();
  const effectiveLocation = simulatedLocation || location;
  const isDriverInZone = effectiveLocation ? isLocationInMafereZone(effectiveLocation) : true;

  const { isAvailable, currentAddress, isToggling, handleToggleAvailability, isArrivalModalVisible, isCompletingRide, handleConfirmArrival, handleSnoozeArrival } =
    useDriverLifecycle({
      user, currentRide, location: effectiveLocation, simulatedLocation, setSimulatedLocation,
      isDriverInZone, mapRef, errorMsg, isRideActive, isDisabled: isSubLoading ? false : isBlocked,
    });

  const handleToggleOrRedirect = () => {
    if (isBlocked) {
      if (isBlockedByVerification) {
        if (user?.verificationStatus === 'pending') {
          dispatch(showErrorToast({
            title: 'Vérification en cours',
            message: "Votre dossier d'identité est en cours d'examen par l'administration.",
          }));
        } else {
          navigation.navigate('Profile');
        }
      } else {
        const { setSubscriptionModalDismissed } = require('../../store/slices/authSlice');
        dispatch(setSubscriptionModalDismissed(false));
        navigation.navigate(isPending ? 'WaitSubscription' : subStatusRedux?.isRejected ? 'PaymentFailure' : 'Subscription');
      }
    } else {
      handleToggleAvailability();
    }
  };

  const isIdentityPromptVisible =
    isFocused && !isRideActive && !isIdentityPromptDismissed && (isActive || promoMode?.isActive) &&
    (user?.verificationStatus === 'none' || !user?.verificationStatus);

  const { mapMarkers, mapTopPadding, mapBottomPadding } = useDriverMapFeatures(currentRide, isRideActive, headerHeight, footerHeight);

  return (
    <View style={styles.screenWrapper}>
      <GpsTeleporter currentRide={currentRide} realLocation={location} simulatedLocation={simulatedLocation} setSimulatedLocation={setSimulatedLocation} mapRef={mapRef} />
      <View style={styles.mapContainer}>
        <MapCard
          ref={mapRef} isDriver={true} rideStatus={currentRide?.status} location={effectiveLocation} driverLocation={effectiveLocation}
          showUserMarker={false} showRecenterButton={true} floating={false} markers={mapMarkers}
          mapTopPadding={mapTopPadding} mapBottomPadding={mapBottomPadding || 240}
          onMarkerPress={(poi) => { if (!isRideActive) setSelectedPoi(poi); }}
        />
        {!effectiveLocation && (
          <View style={styles.floatingLoader}>
            <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
            <Text style={styles.floatingLoaderText}>Synchronisation GPS...</Text>
          </View>
        )}
      </View>

      <View style={styles.headerWrapper} pointerEvents="box-none" onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <SmartHeader
          scrollY={scrollY} address={currentAddress || 'Recherche...'} userName={user?.name?.split(' ')[0] || 'Chauffeur'}
          onMenuPress={() => requestAnimationFrame(() => navigation.navigate('Menu'))}
          onNotificationPress={() => requestAnimationFrame(() => navigation.navigate('Notifications'))}
          onShoppingPress={() => requestAnimationFrame(() => navigation.navigate('MarketplaceHub'))}
        />
        <SubscriptionBanner isActive={isActive} promoMode={promoMode} isPending={isPending} subStatusRedux={subStatusRedux} navigation={navigation} dispatch={dispatch} />
        <VerificationBanner user={user} navigation={navigation} />
      </View>

      <View style={styles.footerWrapper} pointerEvents="box-none" onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
        {isRideActive ? (
          <DriverRideOverlay />
        ) : (
          <SmartFooter
            isAvailable={isAvailable} isToggling={isToggling} onToggleAvailability={handleToggleOrRedirect}
            isBlocked={isBlocked} isBlockedByVerification={isBlockedByVerification} promoMode={promoMode}
          />
        )}
      </View>

      {!isBlocked && (
        <>
          <DriverRequestModal />
          <ArrivalConfirmModal visible={isArrivalModalVisible} onConfirm={handleConfirmArrival} onSnooze={handleSnoozeArrival} isLoading={isCompletingRide} />
        </>
      )}

      <PoiDetailsModal visible={!!selectedPoi} poi={selectedPoi} onClose={() => setSelectedPoi(null)} readOnly={true} />
      <LocationDisclosureModal visible={isDisclosureVisible} onAccept={handleAcceptDisclosure} onDecline={() => setIsDisclosureVisible(false)} />
      <IdentityPromptModal
        visible={isIdentityPromptVisible}
        onVerifyPress={() => {
          setIsIdentityPromptDismissed(true);
          navigation.navigate('Profile');
        }}
        onDismiss={() => setIsIdentityPromptDismissed(true)}
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
    position: 'absolute', top: 140, alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, zIndex: 10,
  },
  floatingLoaderText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 12, fontWeight: '600' },
});

export default DriverHome;