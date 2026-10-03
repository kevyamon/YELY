// src/hooks/useRiderLifecycle.js
// HOOK METIER - Cycle de Vie Passager, Dual-Phase GPS & Commande Résiliente
// CSCSM Level: Bank Grade (Strictement modulaire < 270 lignes, Sans Emojis)

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import MapService from '../services/mapService';
import { useGetCurrentRideQuery, useLazyEstimateRideQuery, useRequestRideMutation } from '../store/api/ridesApiSlice';
import { selectLastAddress, updateAddress } from '../store/slices/locationSlice';
import { clearCurrentRide, setCurrentRide } from '../store/slices/rideSlice';
import { showErrorToast } from '../store/slices/uiSlice';
import { isLocationInMafereZone } from '../utils/mafereZone';

const MOCK_VEHICLES = [
  { id: '1', type: 'echo', name: 'Partagé', duration: '5' },
  { id: '2', type: 'vip', name: 'Privé (Seul)', duration: '8' }
];

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = lat1 * (Math.PI / 180), p2 = lat2 * (Math.PI / 180);
  const dp = (lat2 - lat1) * (Math.PI / 180), dl = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const useRiderLifecycle = ({ location, errorMsg, mapRef, currentRide, rideToRate }) => {
  const dispatch = useDispatch();
  const lastKnownAddress = useSelector(selectLastAddress);
  const appState = useRef(AppState.currentState);
  const previousFetchDataRef = useRef(undefined);
  const lastEstimatedOriginRef = useRef(null);
  const lastEstimatedDestRef = useRef(null);
  const lastGeocodedLocationRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const [currentAddress, setCurrentAddress] = useState(lastKnownAddress || 'Recherche GPS...');
  const [destination, setDestination] = useState(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [estimateRide, { data: estimationData, isLoading: isEstimating, error: estimateError }] = useLazyEstimateRideQuery();
  const [requestRideApi, { isLoading: isOrdering }] = useRequestRideMutation();

  const isWaiting = currentRide && ['searching', 'negotiating', 'accepted', 'arrived'].includes(currentRide.status);
  const { data: fetchedRideData, isSuccess: isFetchSuccess, refetch: refetchCurrentRide } = useGetCurrentRideQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: isWaiting ? 4000 : 0
  });

  const displayVehicles = estimationData?.data?.vehicles || estimationData?.vehicles || MOCK_VEHICLES;
  const effectiveOrigin = location;

  useEffect(() => {
    if (isFetchSuccess && previousFetchDataRef.current !== fetchedRideData) {
      previousFetchDataRef.current = fetchedRideData;
      const ride = fetchedRideData?.data !== undefined ? fetchedRideData.data : fetchedRideData;
      const fetchedId = ride ? (ride._id || ride.id || ride.rideId) : null;
      const currentId = currentRide ? (currentRide._id || currentRide.id || currentRide.rideId) : null;
      if (fetchedId) dispatch(setCurrentRide({ ...ride, rideId: fetchedId }));
      else if (currentId && isFetchSuccess) dispatch(clearCurrentRide());
    }
  }, [fetchedRideData, isFetchSuccess, dispatch, currentRide]);

  useEffect(() => {
    const handleAppState = (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') refetchCurrentRide();
      appState.current = nextState;
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [refetchCurrentRide]);

  // Dual-Phase Geolocation : Phase 1 (Instant 0ms) + Phase 2 (Fond discret & résilient)
  useEffect(() => {
    let isMounted = true;
    if (location) {
      const fastBase = MapService.getFastBaseAddress(location.latitude, location.longitude);
      if (!currentAddress || currentAddress.toLowerCase().includes('recherche')) {
        setCurrentAddress(fastBase);
        dispatch(updateAddress(fastBase));
      }
      const shouldFetch = !lastGeocodedLocationRef.current || getDistance(location.latitude, location.longitude, lastGeocodedLocationRef.current.latitude, lastGeocodedLocationRef.current.longitude) > 25;
      if (shouldFetch) {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(async () => {
          try {
            const enriched = await MapService.getAddressFromCoordinates(location.latitude, location.longitude);
            if (isMounted && enriched) {
              setCurrentAddress(enriched);
              dispatch(updateAddress(enriched));
              lastGeocodedLocationRef.current = location;
            }
          } catch (_) {
            if (isMounted) {
              setCurrentAddress(fastBase);
              dispatch(updateAddress(fastBase));
            }
          }
        }, 300);
      }
    } else if (errorMsg && isMounted) {
      setCurrentAddress("Signal GPS faible");
    }
    return () => {
      isMounted = false;
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [location, errorMsg, dispatch]);

  const handleRefreshLocation = async () => {
    if (!location) return dispatch(showErrorToast({ title: 'GPS', message: 'Signal GPS introuvable.' }));
    const fast = MapService.getFastBaseAddress(location.latitude, location.longitude);
    setCurrentAddress(fast);
    try {
      const addr = await MapService.getAddressFromCoordinates(location.latitude, location.longitude);
      setCurrentAddress(addr);
      dispatch(updateAddress(addr));
      lastGeocodedLocationRef.current = location;
    } catch (_) {}
  };

  useEffect(() => {
    if (destination && displayVehicles?.length > 0) {
      if (!selectedVehicle) {
        const echoOpt = displayVehicles.find(v => v.type === 'echo');
        setSelectedVehicle(echoOpt || displayVehicles[0]);
      } else {
        const matching = displayVehicles.find(v => v.type === selectedVehicle.type);
        if (matching && (matching.price !== selectedVehicle.price || matching.name !== selectedVehicle.name)) {
          setSelectedVehicle(matching);
        }
      }
    }
  }, [destination, displayVehicles, selectedVehicle]);

  useEffect(() => {
    if (rideToRate || !currentRide || currentRide?.status === 'cancelled' || currentRide?.status === 'timeout') {
      setDestination(null);
      setSelectedVehicle(null);
      lastEstimatedOriginRef.current = null;
      lastEstimatedDestRef.current = null;
      setTimeout(() => { mapRef.current?.centerOnUser?.(); }, 300);
    }
  }, [rideToRate, currentRide, mapRef]);

  useEffect(() => {
    if (!effectiveOrigin || !destination) return;
    const oLat = Number(effectiveOrigin.latitude || 0), oLng = Number(effectiveOrigin.longitude || 0);
    const dLat = Number(destination.latitude || 0), dLng = Number(destination.longitude || 0);
    if (!oLat || !oLng || !dLat || !dLng) return;

    let shouldEstimate = !lastEstimatedOriginRef.current || !lastEstimatedDestRef.current;
    if (!shouldEstimate) {
      const distO = getDistance(oLat, oLng, lastEstimatedOriginRef.current.latitude, lastEstimatedOriginRef.current.longitude);
      const distD = getDistance(dLat, dLng, lastEstimatedDestRef.current.latitude, lastEstimatedDestRef.current.longitude);
      if (distO > 15 || distD > 5) shouldEstimate = true;
    }

    if (shouldEstimate && isLocationInMafereZone({ latitude: oLat, longitude: oLng }) && isLocationInMafereZone({ latitude: dLat, longitude: dLng })) {
      lastEstimatedOriginRef.current = { latitude: oLat, longitude: oLng };
      lastEstimatedDestRef.current = { latitude: dLat, longitude: dLng };
      estimateRide({ pickupLat: oLat, pickupLng: oLng, dropoffLat: dLat, dropoffLng: dLng }, false);
    }
  }, [effectiveOrigin, destination, estimateRide]);

  const handlePlaceSelect = (selectedPlace) => {
    const normalizedPlace = {
      ...selectedPlace,
      latitude: Number(selectedPlace.latitude || selectedPlace.lat),
      longitude: Number(selectedPlace.longitude || selectedPlace.lng),
      address: selectedPlace.address || selectedPlace.name || 'Lieu sélectionné'
    };
    if (!isLocationInMafereZone(normalizedPlace)) {
      dispatch(showErrorToast({ title: 'Hors Zone', message: 'Le service ne dessert que la zone autorisée pour le moment.' }));
      setIsSearchModalVisible(false);
      return;
    }
    lastEstimatedOriginRef.current = null;
    lastEstimatedDestRef.current = null;
    setDestination(normalizedPlace);
    setSelectedVehicle(null);
    setIsSearchModalVisible(false);
  };

  const handleCancelDestination = () => {
    setDestination(null);
    setSelectedVehicle(null);
    lastEstimatedOriginRef.current = null;
    lastEstimatedDestRef.current = null;
    if (effectiveOrigin && mapRef.current) mapRef.current.centerOnUser?.();
  };

  const handleConfirmRide = async (passengersCount = 1) => {
    if (!effectiveOrigin) return dispatch(showErrorToast({ title: 'Départ', message: 'Signal GPS en cours d\'acquisition...' }));
    if (!isLocationInMafereZone(effectiveOrigin)) return dispatch(showErrorToast({ title: 'Hors Zone', message: 'Votre position actuelle est hors de la zone couverte.' }));
    if (!destination) return dispatch(showErrorToast({ title: 'Destination', message: 'Veuillez choisir une destination.' }));

    const origLat = Number(effectiveOrigin.latitude || 0), origLng = Number(effectiveOrigin.longitude || 0);
    const destLat = Number(destination.latitude || 0), destLng = Number(destination.longitude || 0);

    if (getDistance(origLat, origLng, destLat, destLng) < 10) return dispatch(showErrorToast({ title: 'Trajet non valide', message: 'Le point de départ et l\'arrivée sont identiques.' }));
    if (!selectedVehicle) return dispatch(showErrorToast({ title: 'Véhicule', message: 'Veuillez sélectionner un forfait.' }));

    try {
      const payload = {
        origin: { address: String(currentAddress || "Position actuelle").trim(), coordinates: [origLng, origLat] },
        destination: { address: String(destination.address || destination.name || "Destination").trim(), coordinates: [destLng, destLat] },
        forfait: String(selectedVehicle.type || 'STANDARD').toUpperCase(),
        passengersCount: typeof passengersCount === 'number' ? passengersCount : 1,
      };

      const res = await requestRideApi(payload).unwrap();
      const rideData = res.data || res;
      dispatch(setCurrentRide({
        ...rideData,
        type: 'RIDE',
        rideId: rideData._id || rideData.rideId || res.rideId,
        status: rideData.status || 'searching',
        origin: rideData.origin || payload.origin,
        destination: rideData.destination || payload.destination,
        forfait: rideData.forfait || payload.forfait,
      }));
    } catch (err) {
      dispatch(showErrorToast({ title: 'Information', message: err?.data?.message || 'Impossible de lancer la commande.' }));
    }
  };

  return {
    effectiveOrigin,
    currentAddress,
    destination,
    isSearchModalVisible,
    setIsSearchModalVisible,
    openSearchModal: () => setIsSearchModalVisible(true),
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
  };
};

export default useRiderLifecycle;