// src/screens/home/DriverHome.jsx
// HOME DRIVER - Auto-Online, Geofencing, Timer Embarquement & Fin de Course

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import GpsTeleporter from '../../components/debug/GpsTeleporter';
import MapCard from '../../components/map/MapCard';
import DriverRequestModal from '../../components/ride/DriverRequestModal';
import DriverRideOverlay from '../../components/ride/DriverRideOverlay';
import SmartFooter from '../../components/ui/SmartFooter';
import SmartHeader from '../../components/ui/SmartHeader';

import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import socketService from '../../services/socketService';
import { useCompleteRideMutation, useStartRideMutation } from '../../store/api/ridesApiSlice';
import { useUpdateAvailabilityMutation } from '../../store/api/usersApiSlice';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import {
  clearCurrentRide,
  selectCurrentRide,
  setEffectiveLocation,
  updateRideStatus,
} from '../../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

import { isLocationInMafereZone } from '../../utils/mafereZone';

const PICKUP_RADIUS_METERS = 10;
const DROPOFF_RADIUS_METERS = 10;

// Duree du statut "Client a bord" avant declenchement automatique du depart (ms)
const BOARDING_DISPLAY_DELAY_MS = 60000;
const BOARDING_GRACE_DELAY_MS = 20000;
const TOTAL_BOARDING_TO_START_MS = BOARDING_DISPLAY_DELAY_MS + BOARDING_GRACE_DELAY_MS;

const POST_COMPLETION_CLEANUP_DELAY_MS = 3000;

const DriverHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const hasAutoConnected = useRef(false);

  const isProcessingPickupRef = useRef(false);
  const isProcessingDropoffRef = useRef(false);
  const boardingStartTimerRef = useRef(null);
  const completionCleanupTimerRef = useRef(null);

  const dispatch = useDispatch();

  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);

  const { location: realLocation, errorMsg } = useGeolocation();
  const [simulatedLocation, setSimulatedLocation] = useState(null);

  const location = simulatedLocation || realLocation;

  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');

  const scrollY = useSharedValue(0);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);

  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();
  const [startRide] = useStartRideMutation();
  const [completeRide] = useCompleteRideMutation();

  const isDriverInZone = isLocationInMafereZone(location);
  const isRideActive = currentRide && ['accepted', 'ongoing'].includes(currentRide.status);

  useEffect(() => {
    if (user?.isAvailable !== undefined) {
      setIsAvailable(user.isAvailable);
    }
  }, [user?.isAvailable]);

  useEffect(() => {
    if (location) {
      dispatch(setEffectiveLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading || 0,
        speed: location.speed || 0,
      }));
    }
  }, [location, dispatch]);

  useEffect(() => {
    const processAutoConnect = async () => {
      if (!hasAutoConnected.current && location && !isAvailable) {
        hasAutoConnected.current = true;

        if (isDriverInZone) {
          try {
            const res = await updateAvailability({ isAvailable: true }).unwrap();
            const actualStatus = res.data ? res.data.isAvailable : true;

            setIsAvailable(actualStatus);
            dispatch(updateUserInfo({ isAvailable: actualStatus }));
            socketService.emitLocation(location);

            dispatch(showSuccessToast({
              title: 'En service (Automatique)',
              message: 'Pret a recevoir des courses.',
            }));
          } catch (err) {
            console.warn('[DriverHome] Erreur auto-connect:', err);
          }
        }
      }
    };

    processAutoConnect();
  }, [location, isAvailable, isDriverInZone, updateAvailability, dispatch]);

  useEffect(() => {
    if (location && (isAvailable || isRideActive)) {
      socketService.emitLocation(location);
    }
  }, [location, isAvailable, isRideActive]);

  useEffect(() => {
    if (location) {
      const getAddress = async () => {
        try {
          const addr = await MapService.getAddressFromCoordinates(
            location.latitude,
            location.longitude
          );
          setCurrentAddress(addr);
        } catch (error) {
          setCurrentAddress(
            `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
          );
        }
      };
      getAddress();
    } else if (errorMsg) {
      setCurrentAddress('Erreur signal GPS');
    }
  }, [location, errorMsg]);

  useEffect(() => {
    if (!currentRide) {
      isProcessingPickupRef.current = false;
      isProcessingDropoffRef.current = false;
    } else if (currentRide.status === 'ongoing') {
      isProcessingPickupRef.current = true;
      isProcessingDropoffRef.current = false;
    } else if (currentRide.status === 'accepted') {
      isProcessingPickupRef.current = false;
      isProcessingDropoffRef.current = false;
    }
  }, [currentRide?.status]);

  useEffect(() => {
    if (boardingStartTimerRef.current) {
      clearTimeout(boardingStartTimerRef.current);
      boardingStartTimerRef.current = null;
    }

    const arrivedAt = currentRide?.arrivedAt;
    const status = currentRide?.status;

    if (!arrivedAt || status !== 'accepted') return;

    const elapsed = Date.now() - arrivedAt;
    const remaining = TOTAL_BOARDING_TO_START_MS - elapsed;

    if (remaining <= 0) {
      triggerBoardingDeparture();
    } else {
      boardingStartTimerRef.current = setTimeout(() => {
        triggerBoardingDeparture();
      }, remaining);
    }

    return () => {
      if (boardingStartTimerRef.current) clearTimeout(boardingStartTimerRef.current);
    };
  }, [currentRide?.arrivedAt, currentRide?.status]);

  const triggerBoardingDeparture = async () => {
    if (!currentRide || currentRide.status !== 'accepted') return;

    try {
      dispatch(updateRideStatus({ status: 'ongoing' }));
      dispatch(showSuccessToast({
        title: 'Depart',
        message: 'Client a bord — En route vers la destination.',
      }));
      await startRide({ rideId: currentRide._id }).unwrap();
    } catch (err) {
      console.warn('[DriverHome] Echec depart apres embarquement:', err);
    }
  };

  // --- ECOUTE DU SIGNAL DE FIN DE COURSE (BACKEND) ---
  useEffect(() => {
    const handleRideCompleted = (data) => {
      if (currentRide && currentRide.status !== 'completed') {
        dispatch(updateRideStatus({ status: 'completed' }));
        // Rafraichissement silencieux des gains si fournis par le socket
        if (data && data.stats) {
          dispatch(updateUserInfo({ 
            totalRides: data.stats.totalRides,
            totalEarnings: data.stats.totalEarnings,
            rating: data.stats.rating
          }));
        }
      }
    };

    socketService.on('ride_completed', handleRideCompleted);
    return () => socketService.off('ride_completed', handleRideCompleted);
  }, [currentRide, dispatch]);

  useEffect(() => {
    if (completionCleanupTimerRef.current) {
      clearTimeout(completionCleanupTimerRef.current);
      completionCleanupTimerRef.current = null;
    }

    if (currentRide?.status === 'completed') {
      dispatch(showSuccessToast({
        title: 'Course terminee',
        message: 'Bien joue ! Vous etes de nouveau disponible.',
      }));

      completionCleanupTimerRef.current = setTimeout(() => {
        dispatch(clearCurrentRide());
      }, POST_COMPLETION_CLEANUP_DELAY_MS);
    }

    return () => {
      if (completionCleanupTimerRef.current) {
        clearTimeout(completionCleanupTimerRef.current);
      }
    };
  }, [currentRide?.status, dispatch]);

  useEffect(() => {
    if (!location || !currentRide) return;

    const status = currentRide.status;

    if (status === 'accepted' && !isProcessingPickupRef.current) {
      const target = currentRide.origin;
      const lat = target?.coordinates?.[1] || target?.latitude;
      const lng = target?.coordinates?.[0] || target?.longitude;

      if (lat && lng) {
        const distance = MapService.calculateDistance(
          location,
          { latitude: Number(lat), longitude: Number(lng) }
        );

        if (distance <= PICKUP_RADIUS_METERS) {
          isProcessingPickupRef.current = true;
          dispatch(updateRideStatus({ arrivedAt: Date.now() }));
        }
      }
    }

    if (status === 'ongoing' && !isProcessingDropoffRef.current) {
      const target = currentRide.destination;
      const lat = target?.coordinates?.[1] || target?.latitude;
      const lng = target?.coordinates?.[0] || target?.longitude;

      if (lat && lng) {
        const distance = MapService.calculateDistance(
          location,
          { latitude: Number(lat), longitude: Number(lng) }
        );

        if (distance <= DROPOFF_RADIUS_METERS) {
          isProcessingDropoffRef.current = true;
          handleAutoCompleteRide();
        }
      }
    }
  }, [location, currentRide]);

  const handleAutoCompleteRide = async () => {
    try {
      dispatch(updateRideStatus({ status: 'completed' }));
      const res = await completeRide({ rideId: currentRide._id }).unwrap();
      
      if (res.data && res.data.stats) {
        dispatch(updateUserInfo({ 
          totalRides: res.data.stats.totalRides,
          totalEarnings: res.data.stats.totalEarnings,
          rating: res.data.stats.rating
        }));
      }
    } catch (err) {
      console.warn('[DriverHome] Echec auto-complete:', err);
      isProcessingDropoffRef.current = false;
    }
  };

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;

    if (newStatus && !isDriverInZone) {
      dispatch(showErrorToast({
        title: 'Acces Refuse',
        message: 'Vous devez etre dans la zone autorisee pour vous mettre en service.',
      }));
      return;
    }

    try {
      const res = await updateAvailability({ isAvailable: newStatus }).unwrap();
      const actualStatus = res.data ? res.data.isAvailable : newStatus;

      setIsAvailable(actualStatus);
      dispatch(updateUserInfo({ isAvailable: actualStatus }));

      if (actualStatus && location) {
        socketService.emitLocation(location);
      }

      dispatch(showSuccessToast({
        title: actualStatus ? 'En service' : 'Hors ligne',
        message: actualStatus ? 'Pret pour les courses.' : 'Mode pause active.',
      }));
    } catch (err) {
      dispatch(showErrorToast({
        title: 'Erreur systeme',
        message: 'Echec de mise a jour du statut.',
      }));
    }
  };

  const mapMarkers = useMemo(() => {
    if (!isRideActive || !currentRide) return [];

    const isOngoing = currentRide.status === 'ongoing';

    const originLat = currentRide.origin?.coordinates?.[1] || currentRide.origin?.latitude;
    const originLng = currentRide.origin?.coordinates?.[0] || currentRide.origin?.longitude;
    const destLat = currentRide.destination?.coordinates?.[1] || currentRide.destination?.latitude;
    const destLng = currentRide.destination?.coordinates?.[0] || currentRide.destination?.longitude;

    if (isOngoing) {
      const result = [];
      if (destLat && destLng) {
        result.push({
          id: 'destination',
          type: 'destination',
          latitude: Number(destLat),
          longitude: Number(destLng),
          title: currentRide.destination?.address || 'Destination',
          iconColor: THEME.COLORS.danger,
        });
      }
      return result;
    }

    if (originLat && originLng) {
      return [{
        id: 'pickup',
        type: 'pickup',
        latitude: Number(originLat),
        longitude: Number(originLng),
        title: currentRide.origin?.address || 'Client',
        iconColor: THEME.COLORS.info,
      }];
    }

    return [];
  }, [isRideActive, currentRide]);

  const mapBottomPadding = isRideActive ? 300 : 320;

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
            <Text style={styles.loadingText}>Acquisition du signal GPS...</Text>
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