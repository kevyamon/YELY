// src/screens/home/DriverHome.jsx
// HOME DRIVER NATIF - Orchestrateur Principal (Smart Drive 2.0 & Always Online Force)
// CSCSM Level: Bank Grade

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
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
import { useGetSubscriptionStatusQuery } from '../../store/api/subscriptionApiSlice';

import { logout, selectCurrentUser, selectPromoMode, selectSubscriptionStatus } from '../../store/slices/authSlice';
import { selectCurrentRide } from '../../store/slices/rideSlice';
import THEME from '../../theme/theme';
import { isLocationInMafereZone } from '../../utils/mafereZone';

const DriverHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

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

  const isSubscriptionLoading = isSubLoading || isFetching;
  const apiSubStatus = subscriptionData?.data || subscriptionData || { isActive: false, isPending: false };
  const isLocallyActive = user?.subscription?.isActive === true;

  const isActive = apiSubStatus.isActive === true || isLocallyActive === true || subStatusRedux?.isActive === true;
  const isPending = apiSubStatus.isPending === true || subStatusRedux?.isPending === true;
  
  const isBlocked = !isActive && !promoMode?.isActive;

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
    }
  }, [isFocused, refetchSubscription]);

  const { location, errorMsg } = useGeolocation();
  const effectiveLocation = simulatedLocation || location;

  const isDriverInZone = effectiveLocation ? isLocationInMafereZone(effectiveLocation) : true;
  const isRideActive = currentRide && ['accepted', 'arrived', 'in_progress'].includes(currentRide.status);

  // NETTOYAGE STRICT : Suppression de isToggling et handleToggleAvailability
  const {
    isAvailable,
    currentAddress,
    isArrivalModalVisible,
    isCompletingRide,
    handleConfirmArrival,
    handleSnoozeArrival
  } = useDriverLifecycle({
    user, currentRide, location: effectiveLocation, isDriverInZone, mapRef, errorMsg, isRideActive, isDisabled: isBlocked 
  });

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

  const renderSubscriptionBlocker = () => {
    if (isActive || promoMode?.isActive) return null; 
    
    if (isSubscriptionLoading && !isSubscriptionError) {
      return (
        <View style={styles.blockerOverlay}>
          <GlobalSkeleton visible={true} fullScreen={false} />
          <Text style={styles.blockerText}>Verification des acces...</Text>
        </View>
      );
    }
    
    if (!isBlocked) return null;
    
    return (
      <View style={styles.blockerOverlay}>
        <GlassCard style={styles.blockerCard}>
          {isPending ? (
            <>
              <Text style={styles.blockerTitle}>Verification en cours</Text>
              <Text style={styles.blockerDesc}>Votre paiement a ete recu. Un administrateur valide votre acces.</Text>
              <View style={styles.loaderSpacing}>
                <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
              </View>
              <GoldButton title="SE DECONNECTER" onPress={() => dispatch(logout())} style={styles.fullWidthButton} />
            </>
          ) : (
            <>
              <Text style={styles.blockerTitle}>Acces Expire</Text>
              <Text style={styles.blockerDesc}>Votre abonnement est arrive a terme. Vous ne pouvez plus recevoir de requetes.</Text>
              <GoldButton title="Renouveler mon abonnement" onPress={() => navigation.navigate('Subscription')} style={styles.fullWidthButton} />
            </>
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      
      <GpsTeleporter 
        currentRide={currentRide} 
        realLocation={location} 
        simulatedLocation={simulatedLocation} 
        setSimulatedLocation={setSimulatedLocation} 
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
          onMenuPress={() => navigation.navigate('Menu')}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      </View>

      {renderSubscriptionBlocker()}

      {!isBlocked && (
        <>
          <View style={styles.footerWrapper} pointerEvents="box-none" onLayout={handleFooterLayout}>
            {/* Le composant n'attend plus de logique de bouton, uniquement la variable isAvailable (toujours true) */}
            {isRideActive ? (
              <DriverRideOverlay />
            ) : (
              <SmartFooter isAvailable={isAvailable} />
            )}
          </View>
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
  fullWidthButton: { width: '100%' }
});

export default DriverHome;