// src/hooks/useDriverLifecycle.js
// HOOK METIER - Cycle de vie du chauffeur, Geofencing et Modale d'Arrivee
// CSCSM Level: Bank Grade

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import MapService from '../services/mapService';
import socketService from '../services/socketService';
import { useCompleteRideMutation, useMarkAsArrivedMutation, useStartRideMutation } from '../store/api/ridesApiSlice';
import { useUpdateAvailabilityMutation } from '../store/api/usersApiSlice';
import { updateUserInfo } from '../store/slices/authSlice';
import { setEffectiveLocation, updateRideStatus } from '../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../store/slices/uiSlice';

const PICKUP_RADIUS_METERS = 30;
const DROPOFF_FALLBACK_RADIUS_METERS = 15;
const SNOOZE_DELAY_MS = 120000;

const useDriverLifecycle = ({
  user,
  currentRide,
  location,
  simulatedLocation,
  setSimulatedLocation,
  isDriverInZone,
  mapRef,
  errorMsg,
  isRideActive
}) => {
  const dispatch = useDispatch();
  const hasAutoConnected = useRef(false);
  const isProcessingPickupRef = useRef(false);
  const snoozeTimerRef = useRef(null);

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const [isArrivalModalVisible, setIsArrivalModalVisible] = useState(false);

  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();
  const [markAsArrived] = useMarkAsArrivedMutation();
  const [startRide] = useStartRideMutation();
  const [completeRide, { isLoading: isCompletingRide }] = useCompleteRideMutation();

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
            console.warn('[DriverLifecycle] Erreur d\'auto-connexion systeme');
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
      setCurrentAddress('Erreur de signal GPS');
    }
  }, [location, errorMsg]);

  useEffect(() => {
    if (!currentRide) {
      isProcessingPickupRef.current = false;
      setIsArrivalModalVisible(false);
      if (snoozeTimerRef.current) {
        clearTimeout(snoozeTimerRef.current);
        snoozeTimerRef.current = null;
      }
    } else if (currentRide.status === 'in_progress') {
      isProcessingPickupRef.current = true;
    } else if (currentRide.status === 'accepted') {
      isProcessingPickupRef.current = false;
    }
  }, [currentRide?.status]);

  useEffect(() => {
    const handlePromptArrival = ({ rideId }) => {
      if (currentRide && currentRide._id === rideId && !snoozeTimerRef.current && currentRide.status === 'in_progress') {
        setIsArrivalModalVisible(true);
      }
    };

    socketService.on('prompt_arrival_confirm', handlePromptArrival);

    return () => {
      socketService.off('prompt_arrival_confirm', handlePromptArrival);
    };
  }, [currentRide]);

  useEffect(() => {
    if (!currentRide) {
      if (simulatedLocation) {
        setSimulatedLocation(null);
      }
      setTimeout(() => {
        if (mapRef.current) mapRef.current.centerOnUser();
      }, 300);
    }
  }, [currentRide, simulatedLocation, setSimulatedLocation, mapRef]);

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
          
          dispatch(updateRideStatus({ arrivedAt: Date.now(), status: 'arrived' }));
          
          markAsArrived({ rideId: currentRide._id }).unwrap().catch(err => {
            console.warn('[DriverLifecycle] Erreur notification d\'arrivee:', err);
            isProcessingPickupRef.current = false; 
          });
        }
      }
    }

    if (status === 'in_progress' && !isArrivalModalVisible && !snoozeTimerRef.current) {
      const target = currentRide.destination;
      const lat = target?.coordinates?.[1] || target?.latitude;
      const lng = target?.coordinates?.[0] || target?.longitude;

      if (lat && lng) {
        const distance = MapService.calculateDistance(
          location,
          { latitude: Number(lat), longitude: Number(lng) }
        );

        if (distance <= DROPOFF_FALLBACK_RADIUS_METERS) {
          setIsArrivalModalVisible(true);
        }
      }
    }
  }, [location, currentRide, dispatch, isArrivalModalVisible, markAsArrived]); 

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;

    if (newStatus && !isDriverInZone) {
      dispatch(showErrorToast({
        title: 'Acces Refuse',
        message: 'Positionnement hors de la zone de service autorisee.',
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
        message: actualStatus ? 'Connexion au reseau de distribution active.' : 'Mode pause active.',
      }));
    } catch (err) {
      dispatch(showErrorToast({
        title: 'Erreur systeme',
        message: 'Impossible de modifier le statut de service.',
      }));
    }
  };

  const handleConfirmArrival = async () => {
    if (!currentRide) return;
    try {
      const res = await completeRide({ rideId: currentRide._id }).unwrap();
      setIsArrivalModalVisible(false);
      
      if (res.data && res.data.stats) {
        dispatch(updateUserInfo({ 
          totalRides: res.data.stats.totalRides,
          totalEarnings: res.data.stats.totalEarnings,
          rating: res.data.stats.rating
        }));
      }

      dispatch(showSuccessToast({
        title: 'Course terminee',
        message: 'Vos gains ont ete credites avec succes.',
      }));
    } catch (err) {
      dispatch(showErrorToast({
        title: 'Erreur de cloture',
        message: err?.data?.message || 'Impossible de terminer la course. Etes-vous assez proche ?',
      }));
    }
  };

  const handleSnoozeArrival = () => {
    setIsArrivalModalVisible(false);
    snoozeTimerRef.current = setTimeout(() => {
      snoozeTimerRef.current = null;
      if (currentRide && currentRide.status === 'in_progress') {
        setIsArrivalModalVisible(true);
      }
    }, SNOOZE_DELAY_MS);
  };

  return {
    isAvailable,
    currentAddress,
    isToggling,
    handleToggleAvailability,
    isArrivalModalVisible,
    isCompletingRide,
    handleConfirmArrival,
    handleSnoozeArrival
  };
};

export default useDriverLifecycle;