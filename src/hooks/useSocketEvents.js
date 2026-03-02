// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Gestion stricte des flux et Telemetrie GPS
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { selectIsAuthenticated, updateUserInfo } from '../store/slices/authSlice';
import {
  clearCurrentRide,
  clearIncomingRide,
  setCurrentRide,
  setIncomingRide,
  setRideToRate,
  updateDriverLocation,
  updateRideStatus
} from '../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../store/slices/uiSlice';

const useSocketEvents = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const lastProcessedEventRef = useRef('');

  useEffect(() => {
    if (!isAuthenticated) return;

    // Filtre Anti-Spam (Idempotence) pour eviter de flasher des Toasts en double
    const isDuplicateEvent = (eventKey) => {
      if (lastProcessedEventRef.current === eventKey) return true;
      lastProcessedEventRef.current = eventKey;
      return false;
    };

    const handleRideCancelled = (data) => {
      if (isDuplicateEvent(`cancelled_${data?.rideId}`)) return;
      
      dispatch(clearCurrentRide());
      dispatch(clearIncomingRide());
      dispatch(showErrorToast({
        title: 'Course annulee',
        message: data?.reason || 'Annulation confirmee par le serveur.',
      }));
    };

    const handleNewRideRequest = (data) => {
      if (data && data.rideId && data.origin && data.destination) {
        dispatch(setIncomingRide(data));
      }
    };

    const handleRideTakenByOther = () => {
      dispatch(clearIncomingRide());
    };

    const handleProposalAccepted = (data) => {
      const id = data?._id || data?.rideId;
      if (isDuplicateEvent(`accepted_${id}`)) return;

      dispatch(setCurrentRide({ ...data, status: 'accepted' }));
      dispatch(clearIncomingRide());
      dispatch(showSuccessToast({
        title: 'Course confirmee',
        message: 'Tarification validee. Demarrage de l\'itineraire d\'approche.',
      }));
    };

    const handleProposalRejected = () => {
      if (isDuplicateEvent('proposal_rejected')) return;

      dispatch(clearIncomingRide());
      dispatch(showErrorToast({
        title: 'Proposition declinee',
        message: 'Le client a refuse la tarification soumise.',
      }));
    };

    const handleDriverFound = (data) => {
      dispatch(updateRideStatus({
        status: 'negotiating',
        driverName: data?.driverName || 'Identification en cours',
      }));
    };

    const handlePriceProposal = (data) => {
      dispatch(setCurrentRide({
        proposedPrice: data.amount,
        driverName: data.driverName,
        status: 'negotiating',
      }));
    };

    const handleRideStarted = (data) => {
      if (isDuplicateEvent(`started_${data?.rideId}`)) return;
      dispatch(updateRideStatus({
        status: 'in_progress', 
        startedAt: data.startedAt,
      }));
    };

    const handleRideArrived = (data) => {
      if (isDuplicateEvent(`arrived_${data?.rideId}`)) return;
      dispatch(updateRideStatus({
        status: 'arrived',
        arrivedAt: data.arrivedAt || Date.now(),
      }));
    };

    const handleRideCompleted = (data) => {
      const ridePayload = data?.ride || data;
      const id = ridePayload?._id || ridePayload?.id || data?.rideId;
      
      if (isDuplicateEvent(`completed_${id}`)) return;

      dispatch(setRideToRate(ridePayload));
      
      if (data?.stats) {
        dispatch(updateUserInfo({
          totalRides: data.stats.totalRides,
          totalEarnings: data.stats.totalEarnings,
          rating: data.stats.rating
        }));
      }

      dispatch(clearCurrentRide());

      dispatch(showSuccessToast({
        title: 'Destination atteinte',
        message: 'Service termine. La course a ete archivee.',
      }));
    };

    const handleRideStatusUpdate = (data) => {
      if (!data?.status) return;

      // NETTOYAGE DES DOUBLONS : On ignore les statuts qui ont deja des ecouteurs specifiques (arrived, completed, in_progress, accepted)
      // pour eviter l'effet d'echo et le declenchement repetitif de notifications
      if (['completed', 'arrived', 'in_progress', 'accepted', 'cancelled'].includes(data.status)) {
        return;
      }

      dispatch(updateRideStatus({ status: data.status }));
    };

    const handleSearchTimeout = (data) => {
      if (isDuplicateEvent('search_timeout')) return;

      dispatch(clearCurrentRide());
      dispatch(showErrorToast({
        title: 'Delai expire',
        message: data?.message || "Recherche infructueuse dans la zone cible.",
      }));
    };

    const handleDriverLocationUpdate = (data) => {
      if (!data) return;

      let lat, lng, heading;

      if (data.latitude && data.longitude) {
        lat = data.latitude;
        lng = data.longitude;
        heading = data.heading;
      } else if (data.location && data.location.coordinates) {
        lat = data.location.coordinates[1];
        lng = data.location.coordinates[0];
        heading = data.heading;
      } else if (data.coordinates) {
        lat = data.coordinates[1];
        lng = data.coordinates[0];
        heading = data.heading;
      }

      if (lat && lng) {
        dispatch(updateDriverLocation({
          latitude: Number(lat),
          longitude: Number(lng),
          heading: heading || 0
        }));
      }
    };

    socketService.on('new_ride_request', handleNewRideRequest);
    socketService.on('ride_taken_by_other', handleRideTakenByOther);
    socketService.on('ride_cancelled', handleRideCancelled);
    socketService.on('driver_found', handleDriverFound);
    socketService.on('price_proposal_received', handlePriceProposal);
    socketService.on('proposal_accepted', handleProposalAccepted);
    socketService.on('proposal_rejected', handleProposalRejected);
    socketService.on('ride_started', handleRideStarted);
    socketService.on('ride_arrived', handleRideArrived);
    socketService.on('ride_completed', handleRideCompleted);
    // Suppression volontaire du RIDE_COMPLETED redondant
    socketService.on('ride_status_update', handleRideStatusUpdate);
    socketService.on('search_timeout', handleSearchTimeout);
    socketService.on('driver_location_update', handleDriverLocationUpdate);

    return () => {
      socketService.off('new_ride_request', handleNewRideRequest);
      socketService.off('ride_taken_by_other', handleRideTakenByOther);
      socketService.off('ride_cancelled', handleRideCancelled);
      socketService.off('driver_found', handleDriverFound);
      socketService.off('price_proposal_received', handlePriceProposal);
      socketService.off('proposal_accepted', handleProposalAccepted);
      socketService.off('proposal_rejected', handleProposalRejected);
      socketService.off('ride_started', handleRideStarted);
      socketService.off('ride_arrived', handleRideArrived);
      socketService.off('ride_completed', handleRideCompleted);
      socketService.off('ride_status_update', handleRideStatusUpdate);
      socketService.off('search_timeout', handleSearchTimeout);
      socketService.off('driver_location_update', handleDriverLocationUpdate);
    };
  }, [isAuthenticated, dispatch]);
};

export default useSocketEvents;