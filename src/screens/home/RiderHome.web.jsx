// src/screens/home/RiderHome.web.jsx
// HOME RIDER WEB - Orchestrateur (Bouclier Temporel & Smart Panning & Instant UI)
// CSCSM Level: Bank Grade

import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import GpsTeleporter from '../../components/debug/GpsTeleporter';
import MapCard from '../../components/map/MapCard.web';
import PoiDetailsModal from '../../components/map/PoiDetailsModal';
import RatingModal from '../../components/ride/RatingModal';
import RiderRideOverlay from '../../components/ride/RiderRideOverlay';
import RiderWaitModal from '../../components/ride/RiderWaitModal';
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
import GpsPermissionModal from '../../components/ui/GpsPermissionModal.web';
import PwaIOSWarningModal from '../../components/ui/PwaIOSWarningModal';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation.web';
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

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const rideToRate = useSelector(selectRideToRate);
  
  const { location: realLocation, errorMsg, isLoading, isPermissionDenied, retryGeolocation } = useGeolocation(); 
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  
  const location = simulatedLocation || realLocation;

  const isUserInZone = location ? isLocationInMafereZone(location) : true;
  const isRideActive = currentRide && ['accepted', 'arrived', 'in_progress'].includes(currentRide.status);

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
    driverLatLng,
    mapTraceOrigin
  } = useRiderMapFeatures({
    destination,
    isRideActive,
    currentRide,
    location: effectiveOrigin 
  });

  const handlePoiSelection = (poi) => {
    setSelectedPoi(null);
    handlePlaceSelect({
      latitude: poi.latitude,
      longitude: poi.longitude,
      address: poi.name,
    }, 'destination');
  };

  let dynamicTopPadding = 140; 
  let dynamicBottomPadding = 220; 

  if (isRideActive) {
    dynamicBottomPadding = 360; 
    dynamicTopPadding = 160; 
  } else if (displayVehicles && displayVehicles.length > 0) {
    dynamicBottomPadding = 420; 
  } else if (destination) {
    dynamicBottomPadding = 300; 
  }

  return (
    <View style={styles.screenWrapper}>
      
      <View style={styles.mapContainer}>
        <MapCard 
          ref={mapRef}
          location={mapTraceOrigin}
          driverLocation={isRideActive ? driverLatLng : null}
          showUserMarker={currentRide?.status !== 'in_progress' && !!effectiveOrigin}
          showRecenterButton={true}
          floating={false}
          markers={mapMarkers}
          mapTopPadding={dynamicTopPadding}       
          mapBottomPadding={dynamicBottomPadding} 
          onMarkerPress={(poi) => {
            if (!isRideActive) {
              setSelectedPoi(poi);
            }
          }}
        />
        
        {(!effectiveOrigin && isLoading) && (
          <View style={styles.floatingLoader}>
            <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
            <Text style={styles.floatingLoaderText}>Signal GPS Web...</Text>
          </View>
        )}
      </View>

      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress || (isPermissionDenied ? "GPS Désactivé" : "Recherche...")}
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

      {!isRideActive && (
        <GpsTeleporter
          currentRide={currentRide}
          realLocation={realLocation}
          simulatedLocation={simulatedLocation}
          setSimulatedLocation={setSimulatedLocation}
        />
      )}

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

      <PwaIOSWarningModal isDriver={false} />
      <GpsPermissionModal isPermissionDenied={isPermissionDenied} onRetry={retryGeolocation} />
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
  floatingLoaderText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 12, fontWeight: '600' },
});

export default RiderHome;