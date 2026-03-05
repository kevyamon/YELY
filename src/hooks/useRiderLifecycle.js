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

const useRiderLifecycle = ({ location, errorMsg, isUserInZone, mapRef, currentRide, rideToRate }) => {
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);
  const previousFetchDataRef = useRef(undefined); // FIX : Bloque la resurrection d'etat

  const [currentAddress, setCurrentAddress] = useState('Recherche GPS...');
  const [destination, setDestination] = useState(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [estimateRide, { data: estimationData, isLoading: isEstimating, error: estimateError }] = useLazyEstimateRideQuery();
  const [requestRideApi, { isLoading: isOrdering }] = useRequestRideMutation();
  
  const { data: fetchedRideData, isSuccess: isFetchSuccess, refetch: refetchCurrentRide } = useGetCurrentRideQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const displayVehicles = estimationData?.vehicles || MOCK_VEHICLES;

  // RESTAURATION ET DESTRUCTION ROBUSTE (Anti-Zombie State)
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

  useEffect(() => {
    if (location) {
      const getAddress = async () => {
        try {
          const addr = await MapService.getAddressFromCoordinates(location.latitude, location.longitude);
          setCurrentAddress(addr);
        } catch (error) {
          setCurrentAddress(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
        }
      };
      getAddress();
    } else if (errorMsg) {
      setCurrentAddress("Signal GPS perdu");
    }
  }, [location, errorMsg]);

  useEffect(() => {
    if (destination && displayVehicles?.length > 0 && !selectedVehicle) {
      const standardOption = displayVehicles.find(v => v.type === 'standard');
      setSelectedVehicle(standardOption || displayVehicles[0]);
    }
  }, [destination, displayVehicles, selectedVehicle]);

  useEffect(() => {
    if (rideToRate || (!currentRide && !fetchedRideData) || currentRide?.status === 'cancelled') {
      setDestination(null);
      setSelectedVehicle(null);
      setTimeout(() => {
        if (mapRef.current) mapRef.current.centerOnUser();
      }, 300);
    }
  }, [rideToRate, currentRide, fetchedRideData, mapRef]);

  const handleDestinationSelect = async (selectedPlace) => {
    if (!isLocationInMafereZone(selectedPlace)) {
      dispatch(showErrorToast({ 
        title: 'Hors Zone', 
        message: 'Le service ne dessert que la zone autorisee pour le moment.' 
      }));
      setIsSearchModalVisible(false);
      return;
    }

    setDestination(selectedPlace);
    setSelectedVehicle(null);
    
    if (location && mapRef.current) {
      estimateRide({
        pickupLat: location.latitude, pickupLng: location.longitude,
        dropoffLat: selectedPlace.latitude, dropoffLng: selectedPlace.longitude
      });
    }
  };

  const handleCancelDestination = () => {
    setDestination(null);
    setSelectedVehicle(null);
    
    if (location && mapRef.current) {
      mapRef.current.centerOnUser();
    }
  };

  const handleConfirmRide = async (passengersCount = 1) => {
    const validPassengersCount = typeof passengersCount === 'number' ? passengersCount : 1;

    if (!location) {
      dispatch(showErrorToast({ title: 'Erreur GPS', message: 'Localisation introuvable. Activez votre GPS.' }));
      return;
    }
    if (!isUserInZone) {
      dispatch(showErrorToast({ title: 'Hors Zone', message: 'Positionnement hors de la zone de service autorisee.' }));
      return;
    }
    if (!destination) {
      dispatch(showErrorToast({ title: 'Destination', message: 'Veuillez choisir une destination.' }));
      return;
    }
    if (!selectedVehicle) {
      dispatch(showErrorToast({ title: 'Vehicule', message: 'Veuillez selectionner un type de vehicule.' }));
      return;
    }
    
    try {
      const origLng = Number(location.longitude || location.lng || 0);
      const origLat = Number(location.latitude || location.lat || 0);
      const destLng = Number(destination.longitude || destination.lng || 0);
      const destLat = Number(destination.latitude || destination.lat || 0);

      let safeOriginAddress = String(currentAddress || "Position actuelle").trim();
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
  };
};

export default useRiderLifecycle;