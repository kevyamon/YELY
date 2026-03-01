// src/hooks/useDriverLifecycle.js
// HOOK METIER - Cycle de vie du chauffeur, Geofencing et Timers
// CSCSM Level: Bank Grade

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import MapService from '../services/mapService';
import socketService from '../services/socketService';
import { useCompleteRideMutation, useStartRideMutation } from '../store/api/ridesApiSlice';
import { useUpdateAvailabilityMutation } from '../store/api/usersApiSlice';
import { updateUserInfo } from '../store/slices/authSlice';
import { setEffectiveLocation, updateRideStatus } from '../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../store/slices/uiSlice';

const PICKUP_RADIUS_METERS = 30;
const DROPOFF_RADIUS_METERS = 30;

const BOARDING_DISPLAY_DELAY_MS = 60000;
const BOARDING_GRACE_DELAY_MS = 20000;
const TOTAL_BOARDING_TO_START_MS = BOARDING_DISPLAY_DELAY_MS + BOARDING_GRACE_DELAY_MS;

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
  const isProcessingDropoffRef = useRef(false);
  const boardingStartTimerRef = useRef(null);

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');

  const [updateAvailability, { isLoading: isToggling }] = useUpdateAvailabilityMutation();
  const [startRide] = useStartRideMutation();
  const [completeRide] = useCompleteRideMutation();

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
            console.warn('[DriverLifecycle] Erreur auto-connect:', err);
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
        console.warn('[DriverLifecycle] Echec depart apres embarquement:', err);
      }
    };

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
  }, [currentRide?.arrivedAt, currentRide?.status, currentRide?._id, dispatch, startRide]);

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
              console.warn('[DriverLifecycle] Echec auto-complete:', err);
              isProcessingDropoffRef.current = false;
            }
          };

          handleAutoCompleteRide();
        }
      }
    }
  }, [location, currentRide, dispatch, completeRide]);

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

  return {
    isAvailable,
    currentAddress,
    isToggling,
    handleToggleAvailability,
  };
};

export default useDriverLifecycle;