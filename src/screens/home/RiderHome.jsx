// src/screens/home/RiderHome.jsx
// HOME RIDER NATIF - Orchestrateur Principal (Aide liee au compte)
// CSCSM Level: Bank Grade

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard';
import PoiDetailsModal from '../../components/map/PoiDetailsModal';
import RatingModal from '../../components/ride/RatingModal';
import RiderRideOverlay from '../../components/ride/RiderRideOverlay';
import RiderWaitModal from '../../components/ride/RiderWaitModal';
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
import GlassModal from '../../components/ui/GlassModal';
import GoldButton from '../../components/ui/GoldButton';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation';
import usePoiSocketEvents from '../../hooks/usePoiSocketEvents';
import useRiderLifecycle from '../../hooks/useRiderLifecycle';
import useRiderMapFeatures from '../../hooks/useRiderMapFeatures';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCurrentRide, selectRideToRate } from '../../store/slices/rideSlice';
import THEME from '../../theme/theme';
import { isLocationInMafereZone } from '../../utils/mafereZone';

const RiderHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);
  
  usePoiSocketEvents();

  const [selectedPoi, setSelectedPoi] = useState(null);
  const [showOutOfZoneTaxiModal, setShowOutOfZoneTaxiModal] = useState(false);

  const [headerHeight, setHeaderHeight] = useState(140);
  const [footerHeight, setFooterHeight] = useState(240);

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const rideToRate = useSelector(selectRideToRate);
  
  const { location, errorMsg } = useGeolocation(); 
  
  const isRideActive = currentRide && 
    currentRide.type !== 'DELIVERY' &&
    ['accepted', 'arrived', 'in_progress'].includes(currentRide.status);



  const {
    effectiveOrigin,
    currentAddress,
    destination,
    isSearchModalVisible,
    setIsSearchModalVisible,
    openSearchModal,
    selectedVehicle,
    setSelectedVehicle,
    displayVehicles,
    isEstimating,
    isOrdering,
    estimationData,
    estimateError,
    handlePlaceSelect,
    handleCancelDestination,
    handleConfirmRide,
    handleRefreshLocation
  } = useRiderLifecycle({
    location,
    errorMsg,
    mapRef,
    currentRide,
    rideToRate
  });

  const isEffectiveOriginInZone = effectiveOrigin ? isLocationInMafereZone(effectiveOrigin) : true;

  const {
    mapMarkers,
    mapTopPadding,
    mapBottomPadding,
    driverLatLng,
    mapTraceOrigin
  } = useRiderMapFeatures({
    destination,
    isRideActive,
    currentRide,
    location: effectiveOrigin,
    dynamicHeaderHeight: headerHeight,
    dynamicFooterHeight: footerHeight
  });

  let activeDriverLocation = null;

  if (isRideActive) {
    activeDriverLocation = driverLatLng;
  }

  const handlePoiSelection = (poi) => {
    if (!isEffectiveOriginInZone) {
      setShowOutOfZoneTaxiModal(true);
      return;
    }
    setSelectedPoi(null);
    handlePlaceSelect({
      latitude: poi.latitude,
      longitude: poi.longitude,
      address: poi.name,
    });
  };

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
      
      <View style={styles.mapContainer}>
        <MapCard 
          ref={mapRef}
          isDriver={false}
          location={location} 
          driverLocation={activeDriverLocation}
          rideStatus={currentRide?.status}
          showUserMarker={currentRide?.status !== 'in_progress' && !!location}
          showRecenterButton={true}
          floating={false}
          markers={mapMarkers}
          mapTopPadding={mapTopPadding}
          mapBottomPadding={mapBottomPadding}
          onMarkerPress={(poi) => {
            if (!isRideActive) {
              setSelectedPoi(poi);
            }
          }}
        />
        
        {!location && (
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
          userName={user?.name?.split(' ')[0] || "Passager"}
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
          onSearchPress={() => {
            if (!isEffectiveOriginInZone) {
              setShowOutOfZoneTaxiModal(true);
              return;
            }
            requestAnimationFrame(() => {
              openSearchModal();
            });
          }}
          onShoppingPress={() => {
            requestAnimationFrame(() => {
              navigation.navigate('MarketplaceHub');
            });
          }}
          hasDestination={!!destination && !isRideActive} 
          onCancelDestination={handleCancelDestination}
          onRefreshLocation={handleRefreshLocation}
        />
      </View>

      <View style={styles.footerWrapper} pointerEvents="box-none" onLayout={handleFooterLayout}>
        {isRideActive ? (
          <RiderRideOverlay />
        ) : (
          <SmartFooter 
            destination={destination}
            displayVehicles={displayVehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
            isEstimating={isEstimating || isOrdering} 
            estimationData={estimationData}
            estimateError={estimateError}
            onConfirmRide={handleConfirmRide}
            isUserInZone={isEffectiveOriginInZone} 
          />
        )}
      </View>

      <DestinationSearchModal 
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onPlaceSelect={(place) => handlePlaceSelect(place)}
      />

      <PoiDetailsModal
        visible={!!selectedPoi}
        poi={selectedPoi}
        onClose={() => setSelectedPoi(null)}
        onSelect={handlePoiSelection}
      />

      <GlassModal
        visible={showOutOfZoneTaxiModal}
        onClose={() => setShowOutOfZoneTaxiModal(false)}
        title="Zone non couverte"
        icon="location-outline"
      >
        <Text style={styles.outOfZoneModalText}>
          Désolé, vous êtes actuellement hors de la zone de prise en charge de Yély, vous ne pouvez donc pas bénéficier de course
        </Text>
        <GoldButton 
          title="J'ai compris" 
          onPress={() => setShowOutOfZoneTaxiModal(false)} 
          style={{ marginTop: 16 }}
        />
      </GlassModal>

      <RiderWaitModal />
      <RatingModal />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  headerWrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  footerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  floatingLoader: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark,
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
  floatingLoaderText: { 
    color: THEME.COLORS.champagneGold, 
    marginLeft: 8, 
    fontSize: 12, 
    fontWeight: '600' 
  },
  outOfZoneModalText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default RiderHome;