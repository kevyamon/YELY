// src/screens/home/RiderHome.web.jsx
// HOME RIDER WEB - Vue Modulaire (Parite totale avec l'App Mobile)
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
import useRiderLifecycle from '../../hooks/useRiderLifecycle';
import useRiderMapFeatures from '../../hooks/useRiderMapFeatures';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCurrentRide, selectRideToRate } from '../../store/slices/rideSlice';
import THEME from '../../theme/theme';
import { isLocationInMafereZone } from '../../utils/mafereZone';

const RiderHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);

  const [selectedPoi, setSelectedPoi] = useState(null);

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const rideToRate = useSelector(selectRideToRate);
  
  // Extraction complète des statuts GPS
  const { location: realLocation, errorMsg, isLoading, isPermissionDenied, retryGeolocation } = useGeolocation(); 
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  
  const location = simulatedLocation || realLocation;

  const isUserInZone = isLocationInMafereZone(location);
  const isRideActive = currentRide && ['accepted', 'arrived', 'in_progress'].includes(currentRide.status);

  const {
    currentAddress,
    destination,
    isSearchModalVisible,
    setIsSearchModalVisible,
    selectedVehicle,
    setSelectedVehicle,
    displayVehicles,
    isEstimating,
    isOrdering,
    estimationData,
    estimateError,
    handleDestinationSelect,
    handleCancelDestination,
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
    location
  });

  const handlePoiSelection = (poi) => {
    setSelectedPoi(null);
    handleDestinationSelect({
      latitude: poi.latitude,
      longitude: poi.longitude,
      address: poi.name,
    });
  };

  // LOGIQUE DE RENDU : Si on a une position OU si le chargement est fini (ex: GPS refusé), on affiche la carte.
  // La MapCard Web est déjà configurée pour afficher Maféré par défaut si location est null.
  const shouldShowMap = location || !isLoading;

  return (
    <View style={styles.screenWrapper}>
      
      <View style={styles.mapContainer}>
         {shouldShowMap ? (
           <MapCard 
             ref={mapRef}
             location={mapTraceOrigin}
             driverLocation={isRideActive ? driverLatLng : null}
             showUserMarker={!isRideActive && !!location}
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
         ) : (
           <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
             <Text style={styles.loadingText}>Recherche satellite en cours...</Text>
           </View>
         )}
      </View>

      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress || (isPermissionDenied ? "GPS Désactivé" : "Recherche...")}
        userName={user?.name?.split(' ')[0] || "Passager"}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={() => setIsSearchModalVisible(true)}
        hasDestination={!!destination && !isRideActive} 
        onCancelDestination={handleCancelDestination}
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
        onClose={() => setIsSearchModalVisible(false)}
        onDestinationSelect={handleDestinationSelect}
      />

      <PoiDetailsModal
        visible={!!selectedPoi}
        poi={selectedPoi}
        onClose={() => setSelectedPoi(null)}
        onSelect={handlePoiSelection}
      />

      <RiderWaitModal />
      <RatingModal />

      {/* INJECTION DES MODALES PWA ET GPS */}
      <PwaIOSWarningModal isDriver={false} />
      <GpsPermissionModal isPermissionDenied={isPermissionDenied} onRetry={retryGeolocation} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.glassDark },
  loadingText: { color: THEME.COLORS.textSecondary, marginTop: 10, fontSize: 12 },
});

export default RiderHome;