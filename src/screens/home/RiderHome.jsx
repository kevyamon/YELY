// src/screens/home/RiderHome.jsx
// HOME RIDER NATIF - Orchestrateur Principal (Synchronisé avec le fallback manuel & Instant UI)
// CSCSM Level: Bank Grade

import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

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

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const rideToRate = useSelector(selectRideToRate);
  
  const { location, errorMsg } = useGeolocation(); 
  
  // 🛡️ BOUCLIER TEMPOREL: Si le GPS cherche, on assume que le passager est dans la zone
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
        {/* 🌟 CARTE INSTANTANÉE (Même sans position, elle affiche Maféré) */}
        <MapCard 
          ref={mapRef}
          location={mapTraceOrigin}
          driverLocation={activeDriverLocation}
          showUserMarker={!isRideActive && !!effectiveOrigin}
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
        
        {/* 🌟 PILULE DE CHARGEMENT DISCRÈTE */}
        {!effectiveOrigin && (
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

    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  // UX: Remplacement du gros bloc opaque par une pilule flottante élégante
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