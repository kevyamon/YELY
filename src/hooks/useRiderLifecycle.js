// src/hooks/useRiderLifecycle.js
// HOOK METIER - Gestion de la commande, Persistance & Destruction Robuste Anti-Zombie
// CSCSM Level: Bank Grade

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useDispatch } from 'react-redux';

import MapService from '../services/mapService';
import { useGetCurrentRideQuery, useLazyEstimateRideQuery, useRequestRideMutation } from '../store/api/ridesApiSlice';
import { clearCurrentRide, setCurrentRide } from '../store/slices/rideSlice';
import { showErrorToast } from '../store/slices/uiSlice';
import { isLocationInMafereZone } from '../utils/mafereZone';

const MOCK_VEHICLES = [
  { id: '1', type: 'echo', name: 'Echo', duration: '5' },
  { id: '2', type: 'standard', name: 'Standard', duration: '3' },
  { id: '3', type: 'vip', name: 'VIP', duration: '8' }
];

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

const useRiderLifecycle = ({ location, errorMsg, isUserInZone, mapRef, currentRide, rideToRate }) => {
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);
  const previousFetchDataRef = useRef(undefined); 

  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  
  const [manualOrigin, setManualOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchModalMode, setSearchModalMode] = useState('destination'); 
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [estimateRide, { data: estimationData, isLoading: isEstimating, error: estimateError }] = useLazyEstimateRideQuery();
  const [requestRideApi, { isLoading: isOrdering }] = useRequestRideMutation();
  
  const { data: fetchedRideData, isSuccess: isFetchSuccess, refetch: refetchCurrentRide } = useGetCurrentRideQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const displayVehicles = estimationData?.vehicles || MOCK_VEHICLES;

  const effectiveOrigin = manualOrigin || location;

  useEffect(() => {
    if (isFetchSuccess && previousFetchDataRef.current !== fetchedRideData) {
      previousFetchDataRef.current = fetchedRideData;
      
      const ride = fetchedRideData?.data !== undefined ? fetchedRideData.data : fetchedRideData;
      const fetchedId = ride ? (ride._id || ride.id || ride.rideId) : null;
      const currentId = currentRide ? (currentRide._id || currentRide.id || currentRide.rideId) : null;

      if (fetchedId) {
        dispatch(setCurrentRide({ ...currentRide, ...ride, rideId: fetchedId }));
      } else if (currentId && isFetchSuccess) {
        dispatch(clearCurrentRide());
      }
    }
  }, [fetchedRideData, isFetchSuccess, currentRide, dispatch]);

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

  const lastGeocodedLocationRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    if (manualOrigin) {
      setCurrentAddress(manualOrigin.address);
    } else if (location) {
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
        setCurrentAddress("Signal GPS perdu");
      }
    }

    return () => {
      isMounted = false;
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [location, errorMsg, manualOrigin]);

  useEffect(() => {
    if (destination && displayVehicles?.length > 0 && !selectedVehicle) {
      const standardOption = displayVehicles.find(v => v.type === 'standard');
      setSelectedVehicle(standardOption || displayVehicles[0]);
    }
  }, [destination, displayVehicles, selectedVehicle]);

  useEffect(() => {
    if (rideToRate || !currentRide || currentRide?.status === 'cancelled' || currentRide?.status === 'timeout') {
      setDestination(null);
      setManualOrigin(null); 
      setSelectedVehicle(null);
      setTimeout(() => {
        if (mapRef.current) mapRef.current.centerOnUser();
      }, 300);
    }
  }, [rideToRate, currentRide, mapRef]);

  const handlePlaceSelect = async (selectedPlace, mode) => {
    if (!isLocationInMafereZone(selectedPlace)) {
      dispatch(showErrorToast({ 
        title: 'Hors Zone', 
        message: 'Le service ne dessert que la zone autorisee pour le moment.' 
      }));
      setIsSearchModalVisible(false);
      return;
    }

    if (mode === 'origin') {
      setManualOrigin(selectedPlace);
      if (destination) {
        estimateRide({
          pickupLat: selectedPlace.latitude, pickupLng: selectedPlace.longitude,
          dropoffLat: destination.latitude, dropoffLng: destination.longitude
        });
      }
    } else {
      setDestination(selectedPlace);
      setSelectedVehicle(null);
      
      if (effectiveOrigin && mapRef.current) {
        estimateRide({
          pickupLat: effectiveOrigin.latitude, pickupLng: effectiveOrigin.longitude,
          dropoffLat: selectedPlace.latitude, dropoffLng: selectedPlace.longitude
        });
      }
    }
  };

  const handleCancelDestination = () => {
    setDestination(null);
    setSelectedVehicle(null);
    if (effectiveOrigin && mapRef.current) {
      mapRef.current.centerOnUser();
    }
  };

  const handleCancelManualOrigin = () => {
    setManualOrigin(null);
    if (destination && location) {
      estimateRide({
        pickupLat: location.latitude, pickupLng: location.longitude,
        dropoffLat: destination.latitude, dropoffLng: destination.longitude
      });
    }
  };

  const openSearchModal = (mode = 'destination') => {
    setSearchModalMode(mode);
    setIsSearchModalVisible(true);
  };

  const handleConfirmRide = async (passengersCount = 1) => {
    const validPassengersCount = typeof passengersCount === 'number' ? passengersCount : 1;

    if (!effectiveOrigin) {
      dispatch(showErrorToast({ title: 'Erreur Depart', message: 'Veuillez definir votre point de depart.' }));
      return;
    }
    
    if (!isLocationInMafereZone(effectiveOrigin)) {
      dispatch(showErrorToast({ title: 'Hors Zone', message: 'Votre point de depart est hors de la zone de service.' }));
      return;
    }

    if (!destination) {
      dispatch(showErrorToast({ title: 'Destination', message: 'Veuillez choisir une destination.' }));
      return;
    }

    // AJOUT : Blocage Trajet Absurde (A vers A)
    const distanceOriginDest = getDistance(
      effectiveOrigin.latitude, effectiveOrigin.longitude,
      destination.latitude, destination.longitude
    );

    // On bloque si la distance est inférieure à 10 mètres pour éviter les commandes sur place
    if (distanceOriginDest < 10) {
      dispatch(showErrorToast({ 
        title: 'Trajet non valide', 
        message: 'Votre point de départ et votre destination sont identiques.' 
      }));
      return;
    }

    if (!selectedVehicle) {
      dispatch(showErrorToast({ title: 'Vehicule', message: 'Veuillez selectionner un type de vehicule.' }));
      return;
    }
    
    try {
      const origLng = Number(effectiveOrigin.longitude || effectiveOrigin.lng || 0);
      const origLat = Number(effectiveOrigin.latitude || effectiveOrigin.lat || 0);
      const destLng = Number(destination.longitude || destination.lng || 0);
      const destLat = Number(destination.latitude || destination.lat || 0);

      let safeOriginAddress = String(currentAddress || effectiveOrigin.address || "Position actuelle").trim();
      if (safeOriginAddress.length < 5) safeOriginAddress += " (Depart)";
      if (safeOriginAddress.length > 190) safeOriginAddress = safeOriginAddress.substring(0, 190);

      let safeDestAddress = String(destination.address || destination.name || "Destination").trim();
      if (safeDestAddress.length < 5) safeDestAddress += " (Arrivee)";
      if (safeDestAddress.length > 190) safeDestAddress = safeDestAddress.substring(0, 190);

      const payload = {
        origin: { address: safeOriginAddress, coordinates: [origLng, origLat] },
        destination: { address: safeDestAddress, coordinates: [destLng, destLat] },
        forfait: String(selectedVehicle.type || 'STANDARD').toUpperCase(),
        passengersCount: validPassengersCount 
      };
      
      const res = await requestRideApi(payload).unwrap();
      const rideData = res.data || res; 
      
      dispatch(setCurrentRide({
        ...rideData,
        rideId: rideData._id || rideData.rideId || res.rideId,
        status: rideData.status || 'searching',
        origin: rideData.origin || payload.origin,
        destination: rideData.destination || payload.destination,
        forfait: rideData.forfait || payload.forfait,
        passengersCount: validPassengersCount
      }));
      
    } catch (error) {
      const errorData = error?.data;
      let errorMessage = errorData?.message || 'Impossible de lancer la commande.';
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.map(e => `${e.field} : ${e.message}`).join('\n');
      } else if (error?.error) {
         errorMessage = error.error; 
      }

      dispatch(showErrorToast({ 
        title: 'Information', 
        message: errorMessage
      }));
    }
  };

  return {
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
  };
};

export default useRiderLifecycle;