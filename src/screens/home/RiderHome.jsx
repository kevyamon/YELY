// src/screens/home/RiderHome.jsx
// HOME RIDER NATIF - Orchestrateur Principal (Aide liee au compte)
// CSCSM Level: Bank Grade

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import HelpVideoModal from '../../components/help/HelpVideoModal';
import MapCard from '../../components/map/MapCard';
import PoiDetailsModal from '../../components/map/PoiDetailsModal';
import RatingModal from '../../components/ride/RatingModal';
import RiderRideOverlay from '../../components/ride/RiderRideOverlay';
import RiderWaitModal from '../../components/ride/RiderWaitModal';
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
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
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const rideToRate = useSelector(selectRideToRate);
  
  const { location, errorMsg } = useGeolocation(); 
  
  const isUserInZone = location ? isLocationInMafereZone(location) : true;
  const isRideActive = currentRide && ['accepted', 'arrived', 'in_progress'].includes(currentRide.status);

  useEffect(() => {
    const checkFirstVisit = async () => {
      if (!user) return; 
      
      const userId = user._id || user.id || 'unknown';
      const storageKey = `@yely_has_seen_help_rider_${userId}`;
      
      try {
        const hasSeen = await AsyncStorage.getItem(storageKey);
        if (!hasSeen) {
          setIsHelpVisible(true);
          await AsyncStorage.setItem(storageKey, 'true');
        }
      } catch (error) {
        if (__DEV__) console.log("Erreur lecture AsyncStorage (Aide)", error);
      }
    };
    checkFirstVisit();
  }, [user]);

  const {
    effectiveOrigin,
    manualOrigin,
    currentAddress,
    destination,
    isSearchModalVisible,
    setIsSearchModalVisible,
    searchModalMode,
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
    handleCancelManualOrigin,
    handleConfirmRide
  } = useRiderLifecycle({
    location,
    errorMsg,
    isUserInZone,
    mapRef,
    currentRide,
    rideToRate
  });

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
    location: effectiveOrigin 
  });

  let activeDriverLocation = null;

  if (isRideActive) {
    if (currentRide?.status === 'in_progress') {
      activeDriverLocation = __DEV__ ? (driverLatLng || effectiveOrigin) : (effectiveOrigin || driverLatLng);
    } else {
      activeDriverLocation = driverLatLng;
    }
  }

  const handlePoiSelection = (poi) => {
    setSelectedPoi(null);
    handlePlaceSelect({
      latitude: poi.latitude,
      longitude: poi.longitude,
      address: poi.name,
    }, 'destination');
  };

  return (
    <View style={styles.screenWrapper}>
      
      <View style={styles.mapContainer}>
        <MapCard 
          ref={mapRef}
          location={location} 
          driverLocation={activeDriverLocation}
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

      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress || "Recherche..."}
        userName={user?.name?.split(' ')[0] || "Passager"}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={() => openSearchModal('destination')}
        onOriginPress={() => openSearchModal('origin')}
        hasDestination={!!destination && !isRideActive} 
        onCancelDestination={handleCancelDestination}
        isManualOrigin={!!manualOrigin}
        onCancelOrigin={handleCancelManualOrigin}
      />

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
          isUserInZone={isUserInZone} 
        />
      )}

      <DestinationSearchModal 
        visible={isSearchModalVisible}
        mode={searchModalMode}
        onClose={() => setIsSearchModalVisible(false)}
        onPlaceSelect={(place) => handlePlaceSelect(place, searchModalMode)}
      />

      <PoiDetailsModal
        visible={!!selectedPoi}
        poi={selectedPoi}
        onClose={() => setSelectedPoi(null)}
        onSelect={handlePoiSelection}
      />

      <RiderWaitModal />
      <RatingModal />
      
      <HelpVideoModal 
        visible={isHelpVisible} 
        onClose={() => setIsHelpVisible(false)} 
        role="rider" 
      />

    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
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
});

export default RiderHome;