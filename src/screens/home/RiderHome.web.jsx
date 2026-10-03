// src/screens/home/RiderHome.web.jsx
// HOME RIDER WEB - Orchestrateur Principal Web (3 Modes de sélection & Carte Hybride)
// CSCSM Level: Bank Grade (Strictement modulaire < 270 lignes, Sans Emojis)

import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import MapCard from '../../components/map/MapCard.web';
import PoiDetailsModal from '../../components/map/PoiDetailsModal';
import RatingModal from '../../components/ride/RatingModal';
import RiderRideOverlay from '../../components/ride/RiderRideOverlay';
import RiderWaitModal from '../../components/ride/RiderWaitModal';
import DestinationSearchModal from '../../components/ui/DestinationSearchModal';
import GlassModal from '../../components/ui/GlassModal';
import GoldButton from '../../components/ui/GoldButton';
import GpsPermissionModal from '../../components/ui/GpsPermissionModal.web';
import MapSelectionBanner from '../../components/ui/MapSelectionBanner';
import PwaIOSWarningModal from '../../components/ui/PwaIOSWarningModal';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation.web';
import usePoiSocketEvents from '../../hooks/usePoiSocketEvents';
import useRiderLifecycle from '../../hooks/useRiderLifecycle';
import useRiderMapFeatures from '../../hooks/useRiderMapFeatures';
import MapService from '../../services/mapService';

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
  const [mapSelectionStep, setMapSelectionStep] = useState('NONE');
  const [headerHeight, setHeaderHeight] = useState(140);
  const [footerHeight, setFooterHeight] = useState(240);

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  const rideToRate = useSelector(selectRideToRate);
  const { location, errorMsg, isLoading, isPermissionDenied, retryGeolocation } = useGeolocation();

  const isRideActive = currentRide && currentRide.type !== 'DELIVERY' &&
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
    handleRefreshLocation,
  } = useRiderLifecycle({ location, errorMsg, mapRef, currentRide, rideToRate });

  const isEffectiveOriginInZone = effectiveOrigin
    ? isLocationInMafereZone(effectiveOrigin)
    : (location ? isLocationInMafereZone(location) : false);

  const { mapMarkers, mapTopPadding, mapBottomPadding, driverLatLng } = useRiderMapFeatures({
    destination,
    isRideActive,
    currentRide,
    location: effectiveOrigin,
    dynamicHeaderHeight: headerHeight,
    dynamicFooterHeight: footerHeight,
  });

  const activeDriverLocation = isRideActive ? driverLatLng : null;

  const handleMapLongPress = async ({ latitude, longitude }) => {
    if (isRideActive) return;
    try {
      const address = await MapService.getAddressFromCoordinates(latitude, longitude);
      const place = { latitude, longitude, address };

      if (mapSelectionStep === 'SELECTING_ORIGIN') {
        handlePlaceSelect(place);
        setMapSelectionStep('SELECTING_DESTINATION');
      } else {
        handlePlaceSelect(place);
        setMapSelectionStep('NONE');
      }
    } catch (_) {}
  };

  return (
    <View style={styles.screenWrapper}>
      {mapSelectionStep !== 'NONE' && (
        <MapSelectionBanner
          step={mapSelectionStep}
          onCancel={() => setMapSelectionStep('NONE')}
        />
      )}

      <View style={styles.mapContainer}>
        <MapCard
          ref={mapRef}
          isDriver={false}
          location={location}
          driverLocation={activeDriverLocation}
          rideStatus={currentRide?.status}
          showUserMarker={currentRide?.status !== 'in_progress' && !!location}
          showRecenterButton={mapSelectionStep === 'NONE'}
          floating={false}
          markers={mapMarkers}
          mapTopPadding={mapTopPadding}
          mapBottomPadding={mapBottomPadding}
          hidePOIs={!!destination || isRideActive || mapSelectionStep !== 'NONE'}
          onLongPress={handleMapLongPress}
          onMarkerPress={(poi) => { if (!isRideActive) setSelectedPoi(poi); }}
        />
        {(!effectiveOrigin && isLoading) && (
          <View style={styles.floatingLoader}>
            <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
            <Text style={styles.floatingLoaderText}>Signal GPS Web...</Text>
          </View>
        )}
      </View>

      {mapSelectionStep === 'NONE' && (
        <View style={styles.headerWrapper} pointerEvents="box-none" onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <SmartHeader
            scrollY={scrollY}
            address={currentAddress || (isPermissionDenied ? "GPS Désactivé" : "Recherche...")}
            userName={user?.name?.split(' ')[0] || "Passager"}
            onMenuPress={() => navigation.navigate('Menu')}
            onNotificationPress={() => navigation.navigate('Notifications')}
            onSearchPress={() => {
              if (!isEffectiveOriginInZone) {
                setShowOutOfZoneTaxiModal(true);
                return;
              }
              openSearchModal();
            }}
            onShoppingPress={() => navigation.navigate('MarketplaceHub')}
            hasDestination={!!destination && !isRideActive}
            destinationAddress={destination?.address || destination?.name || null}
            onCancelDestination={() => {
              setMapSelectionStep('NONE');
              handleCancelDestination();
            }}
            onRefreshLocation={handleRefreshLocation}
          />
        </View>
      )}

      <View style={styles.footerWrapper} pointerEvents="box-none" onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
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
        currentLocation={location}
        currentAddress={currentAddress}
        onPickOnMap={() => setMapSelectionStep('SELECTING_ORIGIN')}
      />

      <PoiDetailsModal
        visible={!!selectedPoi}
        poi={selectedPoi}
        onClose={() => setSelectedPoi(null)}
        onSelect={(poi) => {
          if (!isEffectiveOriginInZone) {
            setShowOutOfZoneTaxiModal(true);
            return;
          }
          setSelectedPoi(null);
          handlePlaceSelect({ latitude: poi.latitude, longitude: poi.longitude, address: poi.name });
        }}
      />

      <GlassModal visible={showOutOfZoneTaxiModal} onClose={() => setShowOutOfZoneTaxiModal(false)} title="Zone non couverte" icon="location-outline">
        <Text style={styles.outOfZoneModalText}>
          Désolé, vous êtes actuellement hors de la zone de prise en charge de Yély, vous ne pouvez donc pas bénéficier de course.
        </Text>
        <GoldButton title="J'ai compris" onPress={() => setShowOutOfZoneTaxiModal(false)} style={{ marginTop: 16 }} />
      </GlassModal>

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
  headerWrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  footerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  floatingLoader: {
    position: 'absolute', top: 140, alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', elevation: 4, zIndex: 10,
  },
  floatingLoaderText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 12, fontWeight: '600' },
  outOfZoneModalText: { color: THEME.COLORS.textPrimary, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
});

export default RiderHome;