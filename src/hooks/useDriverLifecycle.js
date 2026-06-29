// src/hooks/useDriverLifecycle.js
// HOOK METIER - Cycle de vie du chauffeur (Always Online Enforcement)
// CSCSM Level: Bank Grade

import { useEffect, useRef, useState } from 'react';
import { AppState, Vibration } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import MapService from '../services/mapService';
import socketService from '../services/socketService';
import { useCompleteRideMutation, useGetCurrentRideQuery, useMarkAsArrivedMutation, useStartRideMutation } from '../store/api/ridesApiSlice';
import { useUpdateAvailabilityMutation } from '../store/api/usersApiSlice';
import { selectIsRefreshing, updateUserInfo } from '../store/slices/authSlice';
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
  const isRefreshing = useSelector(selectIsRefreshing);

  const isProcessingPickupRef = useRef(false);
  const isProcessingStartRef = useRef(false); 
  const snoozeTimerRef = useRef(null);
  const isSubmittingRef = useRef(false); 
  const appState = useRef(AppState.currentState);
  const previousFetchDataRef = useRef(undefined);
  const hasForcedOnlineRef = useRef(false);
  // Ref stable pour la mutation RTK Query : évite de la mettre dans les deps et d'ouvrir une boucle infinie
  const updateAvailabilityRef = useRef(null);
  // Anti-spam : empêche plusieurs appels simultanés à l'auto-offline
  const isAutoOfflineInProgressRef = useRef(false);
  const mountTimeRef = useRef(Date.now());

  // Verrous temporels (cooldowns) contre les boucles infinies en cas de panne réseau
  const lastPickupAttemptTimeRef = useRef(0);
  const lastStartAttemptTimeRef = useRef(0);
  const lastCompleteAttemptTimeRef = useRef(0);
  const lastOfflineAttemptTimeRef = useRef(0);

  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  const [isArrivalModalVisible, setIsArrivalModalVisible] = useState(false);

  const [updateAvailability] = useUpdateAvailabilityMutation();
  // Synchronisation de la ref stable à chaque render (sans déclencher d'effet)
  updateAvailabilityRef.current = updateAvailability;
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
      }
    }
  }, [fetchedRideData, isFetchSuccess, dispatch]);

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

  const [isToggling, setIsToggling] = useState(false);

  const handleToggleAvailability = async () => {
    if (isToggling || isRefreshing) return;
    setIsToggling(true);
    try {
      const nextState = !user?.isAvailable;
      await updateAvailability({ isAvailable: nextState }).unwrap();
      dispatch(updateUserInfo({ isAvailable: nextState }));
      dispatch(showSuccessToast({
        title: nextState ? 'En ligne' : 'Hors ligne',
        message: nextState ? 'Vous êtes maintenant visible pour recevoir des courses.' : 'Vous ne recevrez plus de demandes.',
      }));
    } catch (err) {
      dispatch(showErrorToast({
        title: 'Erreur',
        message: err?.data?.message || 'Impossible de modifier votre statut de disponibilité.',
      }));
    } finally {
      setIsToggling(false);
    }
  };

  useEffect(() => {
    // Émission GPS uniquement si le chauffeur est en ligne, non bloqué et dans la zone
    if (location && user?.isAvailable && !isDisabled && isDriverInZone) {
      socketService.emitLocation(location);
    }
  }, [location, user?.isAvailable, isDisabled, isDriverInZone]);

  useEffect(() => {
    // GARDE CRITIQUE : on ne déclenche l'auto-offline que si le chauffeur EST VRAIMENT en ligne
    // et que les conditions le justifient. On ne met PAS `updateAvailability` dans les deps
    // car c'est une mutation RTK Query dont la référence est instable → boucle infinie garantie.
    if (isRefreshing) return;
    if (!user?.isAvailable) return; // Déjà offline → rien à faire
    if (!(isDisabled || !isDriverInZone)) return; // Conditions non réunies
    if (isAutoOfflineInProgressRef.current) return; // Anti-spam

    // Grâce de démarrage : on attend 10 secondes après le montage que le GPS se stabilise
    if (Date.now() - mountTimeRef.current < 10000) return;

    // Sécurité contre le flickering et les appels répétés en boucle
    const now = Date.now();
    if (now - lastOfflineAttemptTimeRef.current < 5000) return;
    lastOfflineAttemptTimeRef.current = now;

    isAutoOfflineInProgressRef.current = true;

    const triggerAutoOffline = async () => {
      // Étape 1 : Mise à jour optimiste immédiate dans Redux pour couper la boucle d'effets
      dispatch(updateUserInfo({ isAvailable: false }));
      
      try {
        await updateAvailabilityRef.current({ isAvailable: false }).unwrap();
        dispatch(showErrorToast({
          title: 'Hors zone / Hors service',
          message: !isDriverInZone
            ? 'Vous êtes sorti de la zone de service (Maféré).'
            : 'Votre accès chauffeur a été désactivé.',
        }));
      } catch (err) {
        console.warn('[DriverLifecycle] Echec de mise hors ligne automatique', err);
      } finally {
        isAutoOfflineInProgressRef.current = false;
      }
    };

    triggerAutoOffline();
    // NOTE : `updateAvailabilityRef` (stable via ref) est intentionnellement absent des deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled, isDriverInZone, user?.isAvailable, dispatch, isRefreshing]);

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
              setCurrentAddress(MapService.getFallbackAddress(location.latitude, location.longitude));
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

  const handleRefreshLocation = async () => {
    if (!location) {
      dispatch(showErrorToast({ title: 'GPS', message: 'Signal GPS introuvable.' }));
      return;
    }
    setCurrentAddress('Recherche...');
    try {
      const addr = await MapService.getAddressFromCoordinates(location.latitude, location.longitude);
      setCurrentAddress(addr);
      lastGeocodedLocationRef.current = location;
    } catch (error) {
      setCurrentAddress(MapService.getFallbackAddress(location.latitude, location.longitude));
    }
  };

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

    // Protection anti-boucle : cooldown de 5 secondes entre les tentatives de clôture automatique
    const now = Date.now();
    if (now - lastCompleteAttemptTimeRef.current < 5000) {
      return;
    }
    lastCompleteAttemptTimeRef.current = now;

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
    const now = Date.now();

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
          // Cooldown de 5s pour éviter tout emballement en cas d'erreur de mutation
          if (now - lastPickupAttemptTimeRef.current >= 5000) {
            lastPickupAttemptTimeRef.current = now;
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
          // Cooldown de 5s pour éviter tout emballement en cas d'erreur de mutation
          if (now - lastStartAttemptTimeRef.current >= 5000) {
            lastStartAttemptTimeRef.current = now;
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
    isAvailable: user?.isAvailable || false,
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