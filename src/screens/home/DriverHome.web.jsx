// src/screens/home/DriverHome.web.jsx
// HOME DRIVER WEB - Vue Modulaire (Parite totale avec l'App Mobile)
// CSCSM Level: Bank Grade

import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import GpsTeleporter from '../../components/debug/GpsTeleporter';
import MapCard from '../../components/map/MapCard';
import DriverRequestModal from '../../components/ride/DriverRequestModal';
import DriverRideOverlay from '../../components/ride/DriverRideOverlay';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useDriverLifecycle from '../../hooks/useDriverLifecycle';
import useDriverMapFeatures from '../../hooks/useDriverMapFeatures';
import useGeolocation from '../../hooks/useGeolocation';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCurrentRide } from '../../store/slices/rideSlice';
import THEME from '../../theme/theme';
import { isLocationInMafereZone } from '../../utils/mafereZone';

const DriverHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);

  const { location: realLocation, errorMsg } = useGeolocation();
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const location = simulatedLocation || realLocation;

  const isDriverInZone = isLocationInMafereZone(location);
  const isRideActive = currentRide && ['accepted', 'ongoing'].includes(currentRide.status);

  const {
    isAvailable,
    currentAddress,
    isToggling,
    handleToggleAvailability,
  } = useDriverLifecycle({
    user,
    currentRide,
    location,
    simulatedLocation,
    setSimulatedLocation,
    isDriverInZone,
    mapRef,
    errorMsg,
    isRideActive
  });

  const { mapMarkers, mapBottomPadding } = useDriverMapFeatures(currentRide, isRideActive);

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.mapContainer}>
        {location ? (
          <MapCard
            ref={mapRef}
            location={location}
            showUserMarker={true}
            showRecenterButton={true}
            floating={false}
            markers={mapMarkers}
            recenterBottomPadding={mapBottomPadding}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
            <Text style={styles.loadingText}>Acquisition du signal GPS Web...</Text>
          </View>
        )}
      </View>

      <SmartHeader
        scrollY={scrollY}
        address={currentAddress}
        userName={user?.name?.split(' ')[0] || 'Chauffeur'}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <GpsTeleporter
        currentRide={currentRide}
        realLocation={realLocation}
        simulatedLocation={simulatedLocation}
        setSimulatedLocation={setSimulatedLocation}
      />

      {isRideActive ? (
        <DriverRideOverlay />
      ) : (
        <SmartFooter
          isAvailable={isAvailable}
          onToggle={handleToggleAvailability}
          isToggling={isToggling}
        />
      )}

      <DriverRequestModal />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject, flex: 1, zIndex: 1 },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassDark,
  },
  loadingText: { marginTop: 10, fontSize: 12, color: THEME.COLORS.textSecondary },
});

export default DriverHome;