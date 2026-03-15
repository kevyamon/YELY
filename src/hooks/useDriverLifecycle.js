// src/hooks/useDriverLifecycle.js
// HOOK METIER - Cycle de vie du chauffeur (Always Online Enforcement)
// CSCSM Level: Bank Grade

import { useEffect, useRef, useState } from 'react';
import { AppState, Vibration } from 'react-native';
import { useDispatch } from 'react-redux';

import MapService from '../services/mapService';
import socketService from '../services/socketService';
import { useCompleteRideMutation, useGetCurrentRideQuery, useMarkAsArrivedMutation, useStartRideMutation } from '../store/api/ridesApiSlice';
import { useUpdateAvailabilityMutation } from '../store/api/usersApiSlice';
import { updateUserInfo } from '../store/slices/authSlice';
import { clearCurrentRide, setCurrentRide, setEffectiveLocation, updateRideStatus } from '../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../store/slices/uiSlice';

const PICKUP_RADIUS_METERS = 30;
const AUTO_START_RADIUS_METERS = 20; 
const AUTO_START_SPEED_MS = 4.16; 
const AUTO_COMPLETE_RADIUS_METERS = 30; 
const AUTO_COMPLETE_SPEED_MS = 1.38; 
const SNOOZE_DELAY_MS = 120000;

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = lat1 * (Math.PI / 180);
  const p2 = lat2 * (Math.PI / 180);
  const dp = (lat2 - lat1) * (Math.PI / 180);
  const dl = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const useDriverLifecycle = ({
  user,
  currentRide,
  location,
  simulatedLocation,
  setSimulatedLocation,
  isDriverInZone,
  mapRef,
  errorMsg,
  isRideActive,
  isDisabled
}) => {
  const dispatch = useDispatch();
  const isProcessingPickupRef = useRef(false);
  const isProcessingStartRef = useRef(false); 
  const snoozeTimerRef = useRef(null);
  const isSubmittingRef = useRef(false); 
  const appState = useRef(AppState.currentState);
  const previousFetchDataRef = useRef(undefined);
  const hasForcedOnlineRef = useRef(false);

  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  const [isArrivalModalVisible, setIsArrivalModalVisible] = useState(false);

  const [updateAvailability] = useUpdateAvailabilityMutation();
  const [markAsArrived] = useMarkAsArrivedMutation();
  const [startRide] = useStartRideMutation();
  const [completeRide, { isLoading: isCompletingRide }] = useCompleteRideMutation();
  
  const { data: fetchedRideData, isSuccess: isFetchSuccess, refetch: refetchCurrentRide } = useGetCurrentRideQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  useEffect(() => {
    if (isFetchSuccess && previousFetchDataRef.current !== fetchedRideData) {
      previousFetchDataRef.current = fetchedRideData;
      
      const ride = fetchedRideData?.data !== undefined ? fetchedRideData.data : fetchedRideData;
      const fetchedId = ride ? (ride._id || ride.id || ride.rideId) : null;
      const currentId = currentRide ? (currentRide._id || currentRide.id || currentRide.rideId) : null;

      if (fetchedId) {
        if (currentId !== fetchedId) {
          dispatch(setCurrentRide({ ...ride, rideId: fetchedId }));
        }
      } else if (currentId) {
        dispatch(clearCurrentRide());
        setIsArrivalModalVisible(false);
        if (simulatedLocation && setSimulatedLocation) {
          setSimulatedLocation(null);
        }
      }
    }
  }, [fetchedRideData, isFetchSuccess, currentRide, dispatch, simulatedLocation, setSimulatedLocation]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        refetchCurrentRide();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refetchCurrentRide]);

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

  // LOGIQUE ALWAYS ONLINE ENFORCEMENT CORRIGEE
  useEffect(() => {
    const enforceOnlineStatus = async () => {
      if (location && !isDisabled && isDriverInZone) {
        try {
          // On force l'appel API au moins une fois par session (hasForcedOnlineRef)
          // meme si le cache Redux pense que l'utilisateur est deja en ligne.
          if (!hasForcedOnlineRef.current || !user?.isAvailable) {
             await updateAvailability({ isAvailable: true }).unwrap();
             dispatch(updateUserInfo({ isAvailable: true }));
             hasForcedOnlineRef.current = true;
          }
          socketService.emitLocation(location);
        } catch (err) {
          console.warn('[DriverLifecycle] Tentative de reconnexion auto echouee');
        }
      }
    };

    enforceOnlineStatus();
  }, [location, isDisabled, isDriverInZone, user?.isAvailable, updateAvailability, dispatch]);

  const lastGeocodedLocationRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    if (location) {
      let shouldFetch = false;
      
      if (!lastGeocodedLocationRef.current) {
        shouldFetch = true;
      } else {
        const distance = getDistance(
          location.latitude, location.longitude,
          lastGeocodedLocationRef.current.latitude, lastGeocodedLocationRef.current.longitude
        );
        if (distance > 50) {
          shouldFetch = true;
        }
      }

      if (shouldFetch) {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        
        debounceTimeoutRef.current = setTimeout(async () => {
          try {
            const addr = await MapService.getAddressFromCoordinates(location.latitude, location.longitude);
            if (isMounted) {
              setCurrentAddress(addr);
              lastGeocodedLocationRef.current = location;
            }
          } catch (error) {
            if (isMounted) {
              setCurrentAddress(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
            }
          }
        }, 1500);
      }
    } else if (errorMsg) {
      if (isMounted) {
        setCurrentAddress('Erreur de signal GPS');
      }
    }

    return () => {
      isMounted = false;
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [location, errorMsg]);

  useEffect(() => {
    if (!currentRide && !fetchedRideData) {
      isProcessingPickupRef.current = false;
      isProcessingStartRef.current = false;
      isSubmittingRef.current = false; 
      setIsArrivalModalVisible(false);
      if (snoozeTimerRef.current) {
        clearTimeout(snoozeTimerRef.current);
        snoozeTimerRef.current = null;
      }
    } else if (currentRide?.status === 'in_progress') {
      isProcessingPickupRef.current = true;
      isProcessingStartRef.current = true;
    } else if (currentRide?.status === 'accepted') {
      isProcessingPickupRef.current = false;
    } else if (currentRide?.status === 'arrived') {
      isProcessingStartRef.current = false;
    }
  }, [currentRide?.status, fetchedRideData]);

  useEffect(() => {
    const handlePromptArrival = ({ rideId }) => {
      const currentId = currentRide?._id || currentRide?.id || currentRide?.rideId;
      if (currentId === rideId && !snoozeTimerRef.current && currentRide?.status === 'in_progress') {
        setIsArrivalModalVisible(true);
      }
    };

    socketService.on('prompt_arrival_confirm', handlePromptArrival);
    return () => socketService.off('prompt_arrival_confirm', handlePromptArrival);
  }, [currentRide]);

  useEffect(() => {
    if (!currentRide && !fetchedRideData) {
      if (simulatedLocation && setSimulatedLocation) {
        setSimulatedLocation(null);
      }
      setTimeout(() => {
        if (mapRef.current) mapRef.current.centerOnUser();
      }, 300);
    }
  }, [currentRide, fetchedRideData, simulatedLocation, setSimulatedLocation, mapRef]);

  const handleConfirmArrival = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (!currentRide) {
      isSubmittingRef.current = false;
      return;
    }
    
    const rideId = currentRide._id || currentRide.id || currentRide.rideId;
    if (!rideId) {
      isSubmittingRef.current = false;
      return;
    }

    try {
      dispatch(updateRideStatus({ status: 'completed' }));
      setIsArrivalModalVisible(false);

      const res = await completeRide({ rideId }).unwrap();
      
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
      dispatch(updateRideStatus({ status: 'in_progress' }));
      isSubmittingRef.current = false; 
      dispatch(showErrorToast({
        title: 'Erreur de cloture',
        message: err?.data?.message || 'Impossible de terminer la course. Veuillez reessayer.',
      }));
    }
  };

  useEffect(() => {
    if (!location || !currentRide) return;

    const status = currentRide.status;
    const speed = location.speed || 0; 

    if (status === 'accepted' && !isProcessingPickupRef.current) {
      const target = currentRide.origin;
      const lat = target?.coordinates?.[1] || target?.latitude;
      const lng = target?.coordinates?.[0] || target?.longitude;

      if (lat !== undefined && lng !== undefined) {
        const distance = MapService.calculateDistance(
          location,
          { latitude: Number(lat), longitude: Number(lng) }
        );

        if (distance <= PICKUP_RADIUS_METERS) {
          isProcessingPickupRef.current = true;
          
          dispatch(updateRideStatus({ arrivedAt: Date.now(), status: 'arrived' }));
          
          const rideId = currentRide._id || currentRide.id || currentRide.rideId;
          if (rideId) {
            markAsArrived({ rideId }).unwrap().catch(err => {
              isProcessingPickupRef.current = false; 
            });
          }
        }
      }
    }

    if (status === 'arrived' && !isProcessingStartRef.current) {
      const target = currentRide.origin;
      const lat = target?.coordinates?.[1] || target?.latitude;
      const lng = target?.coordinates?.[0] || target?.longitude;

      if (lat !== undefined && lng !== undefined) {
        const distance = MapService.calculateDistance(
          location,
          { latitude: Number(lat), longitude: Number(lng) }
        );

        if (distance > AUTO_START_RADIUS_METERS || speed > AUTO_START_SPEED_MS) {
          isProcessingStartRef.current = true;
          
          dispatch(updateRideStatus({ status: 'in_progress' }));
          
          const rideId = currentRide._id || currentRide.id || currentRide.rideId;
          if (rideId) {
            startRide({ rideId }).unwrap()
              .then(() => {
                dispatch(showSuccessToast({
                  title: 'En route',
                  message: 'Course demarree automatiquement.',
                }));
              })
              .catch(err => {
                isProcessingStartRef.current = false;
              });
          }
        }
      }
    }

    if (status === 'in_progress' && !isSubmittingRef.current) {
      const target = currentRide.destination;
      const lat = target?.coordinates?.[1] || target?.latitude;
      const lng = target?.coordinates?.[0] || target?.longitude;

      if (lat !== undefined && lng !== undefined) {
        const distance = MapService.calculateDistance(
          location,
          { latitude: Number(lat), longitude: Number(lng) }
        );

        if (distance <= AUTO_COMPLETE_RADIUS_METERS && speed <= AUTO_COMPLETE_SPEED_MS) {
          Vibration.vibrate(200); 
          handleConfirmArrival();
        }
      }
    }
  }, [location, currentRide, dispatch, markAsArrived, startRide]); 

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
    isAvailable: true,
    currentAddress,
    isToggling: false,
    handleToggleAvailability: () => {}, 
    isArrivalModalVisible,
    isCompletingRide,
    handleConfirmArrival,
    handleSnoozeArrival
  };
};

export default useDriverLifecycle;