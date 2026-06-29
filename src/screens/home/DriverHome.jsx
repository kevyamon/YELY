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
import HelpVideoModal from '../../components/help/HelpVideoModal';
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
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  const [headerHeight, setHeaderHeight] = useState(140);
  const [footerHeight, setFooterHeight] = useState(280);

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const subStatusRedux = useSelector(selectSubscriptionStatus); 
  const promoMode = useSelector(selectPromoMode);

  const { 
    data: subscriptionData, 
    isLoading: isSubLoading, 
    isFetching, 
    isError: isSubscriptionError,
    refetch: refetchSubscription 
  } = useGetSubscriptionStatusQuery(undefined, { skip: !isFocused });

  const { data: profileResponse, refetch: refetchProfile } = useGetUserProfileQuery(undefined, { skip: !isFocused });

  const isSubscriptionLoading = isSubLoading || isFetching;
  const apiSubStatus = subscriptionData?.data || subscriptionData || { isActive: false, isPending: false };
  const isLocallyActive = user?.subscription?.isActive === true;

  const isActive = apiSubStatus.isActive === true || isLocallyActive === true || subStatusRedux?.isActive === true;
  const isPending = apiSubStatus.isPending === true || subStatusRedux?.isPending === true;
  
  const isBlockedByVerification = user?.verificationStatus !== 'approved';
  const isSubscriptionBlocked = !isActive && !promoMode?.isActive;
  const isBlocked = isSubscriptionBlocked || isBlockedByVerification;
  const isSubscriptionModalDismissed = useSelector(selectIsSubscriptionModalDismissed);

  // Synchronisation en temps réel des infos de l'utilisateur (identités + abonnements)
  useEffect(() => {
    if (profileResponse?.data) {
      dispatch(updateUserInfo(profileResponse.data));
    }
  }, [profileResponse, dispatch]);

  useEffect(() => {
    // Sécurité Senior : Ne pas rediriger tant que les configurations de démarrage (Promo VIP / Abonnement) chargent
    if (promoMode === null || isSubscriptionLoading) return;

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
  }, [isFocused, isSubscriptionBlocked, isPending, subStatusRedux?.isRejected, isSubscriptionModalDismissed, promoMode, isSubscriptionLoading, navigation]);

  useEffect(() => {
    const checkFirstVisit = async () => {
      if (!user) return;
      
      const userId = user._id || user.id || 'unknown';
      const storageKey = `@yely_has_seen_help_driver_${userId}`;
      
      try {
        const hasSeen = await AsyncStorage.getItem(storageKey);
        if (!hasSeen) {
          setIsHelpVisible(true);
          await AsyncStorage.setItem(storageKey, 'true');
        }
      } catch (error) {
        if (__DEV__) console.log("Erreur lecture AsyncStorage", error);
      }
    };
    checkFirstVisit();
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      refetchSubscription();
      refetchProfile();
    }
  }, [isFocused, refetchSubscription, refetchProfile]);

  const { location, errorMsg } = useGeolocation();
  const effectiveLocation = simulatedLocation || location;

  const isDriverInZone = effectiveLocation ? isLocationInMafereZone(effectiveLocation) : true;
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

  const renderVerificationBanner = () => {
    const status = user?.verificationStatus || 'none';
    if (status === 'approved') return null;

    let bannerStyle = styles.bannerPending;
    let iconName = "time-outline";
    let text = "Vérification en cours de traitement...";
    let textColor = "#000";

    if (status === 'none') {
      bannerStyle = styles.bannerPending;
      iconName = "warning-outline";
      text = "Pièces d'identité requises. [Vérifier]";
      textColor = "#000";
    } else if (status === 'rejected') {
      bannerStyle = styles.bannerBlocked;
      iconName = "alert-circle-outline";
      text = `Vérification rejetée : ${user?.rejectionReason || "Documents non conformes"}. [Vérifier]`;
      textColor = "#FFF";
    }

    return (
      <TouchableOpacity 
        style={[styles.bannerContainer, bannerStyle, { marginTop: 5 }]} 
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.9}
      >
        <Ionicons name={iconName} size={20} color={textColor} />
        <Text style={[styles.bannerText, { color: textColor }]} numberOfLines={1}>
          {text}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={textColor} />
      </TouchableOpacity>
    );
  };

  const renderSubscriptionBanner = () => {
    if (isActive || promoMode?.isActive) return null; 
    
    return (
      <TouchableOpacity 
        style={[
          styles.bannerContainer, 
          isPending ? styles.bannerPending : styles.bannerBlocked
        ]} 
        onPress={() => {
          const { setSubscriptionModalDismissed } = require('../../store/slices/authSlice');
          dispatch(setSubscriptionModalDismissed(false));
          if (isPending) {
            navigation.navigate('WaitSubscription');
          } else if (subStatusRedux?.isRejected) {
            navigation.navigate('PaymentFailure');
          } else {
            navigation.navigate('Subscription');
          }
        }}
        activeOpacity={0.9}
      >
        <Ionicons 
          name={isPending ? "time-outline" : "warning-outline"} 
          size={20} 
          color={isPending ? "#000" : "#FFF"} 
        />
        <Text style={[styles.bannerText, isPending && { color: '#000' }]} numberOfLines={1}>
          {isPending 
            ? "Paiement en attente de validation... [Détails]" 
            : "Abonnement expiré. Vos fonctions de conduite sont désactivées. [S'abonner]"
          }
        </Text>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={isPending ? "#000" : "#FFF"} 
        />
      </TouchableOpacity>
    );
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
        {renderSubscriptionBanner()}
        {renderVerificationBanner()}
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
      
      <HelpVideoModal 
        visible={isHelpVisible} 
        onClose={() => setIsHelpVisible(false)} 
        role="driver" 
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
  floatingLoaderText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 12, fontWeight: '600' },
  
  blockerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 20 },
  blockerCard: { width: '100%', alignItems: 'center' },
  blockerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.textPrimary || '#FFFFFF', marginBottom: 15, textAlign: 'center' },
  blockerDesc: { fontSize: 16, color: THEME.COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 25 },
  blockerText: { color: '#FFFFFF', marginTop: 15, fontSize: 16 },
  loaderSpacing: { marginTop: 10, marginBottom: 25, width: '100%', alignItems: 'center' },
  fullWidthButton: { width: '100%' },

  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bannerPending: {
    backgroundColor: '#FFCC00', // Jaune attention
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bannerBlocked: {
    backgroundColor: '#E74C3C', // Rouge danger
  },
  bannerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 10,
  }
});

export default DriverHome;