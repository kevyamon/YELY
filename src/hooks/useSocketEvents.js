// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Gestion stricte des flux et Telemetrie GPS
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
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

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleRideCancelled = (data) => {
      dispatch(clearCurrentRide());
      dispatch(clearIncomingRide());
      dispatch(showErrorToast({
        title: 'Course annulee',
        message: data?.reason || 'Annulation confirmée par le serveur.',
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
      dispatch(setCurrentRide({ ...data, status: 'accepted' }));
      dispatch(clearIncomingRide());
      dispatch(showSuccessToast({
        title: 'Course confirmee',
        message: 'Tarification validee. Demarrage de l\'itineraire d\'approche.',
      }));
    };

    const handleProposalRejected = () => {
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

    // 🛡️ CORRECTION : Le statut est passe de 'ongoing' a 'in_progress'
    const handleRideStarted = (data) => {
      dispatch(updateRideStatus({
        status: 'in_progress', 
        startedAt: data.startedAt,
      }));
    };

    // 🛡️ NOUVEAU : On ecoute explicitement l'arrivee du chauffeur
    const handleRideArrived = (data) => {
      dispatch(updateRideStatus({
        status: 'arrived',
        arrivedAt: data.arrivedAt || Date.now(),
      }));
    };

    const handleRideCompleted = (data) => {
      dispatch(setRideToRate(data.ride || data));
      
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

      if (data.status === 'completed') {
        handleRideCompleted(data);
        return;
      }

      // 🛡️ CORRECTION : Le statut est passe de 'ongoing' a 'in_progress'
      if (data.status === 'in_progress') {
        dispatch(updateRideStatus({
          status: 'in_progress',
          startedAt: data?.ride?.startedAt,
        }));
        return;
      }

      // 🛡️ CORRECTION : On s'assure que le passage a 'arrived' via ce fallback marche aussi
      if (data.status === 'arrived') {
        dispatch(updateRideStatus({
          status: 'arrived',
          arrivedAt: Date.now(),
        }));
      }
    };

    const handleSearchTimeout = (data) => {
      dispatch(clearCurrentRide());
      dispatch(showErrorToast({
        title: 'Delai expire',
        message: data?.message || "Recherche infructueuse dans la zone cible.",
      }));
    };

    const handleDriverLocationUpdate = (data) => {
      if (data && data.latitude && data.longitude) {
        dispatch(updateDriverLocation(data));
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
    socketService.on('ride_arrived', handleRideArrived); // 🛡️ BRANCHE !
    socketService.on('ride_completed', handleRideCompleted);
    socketService.on('RIDE_COMPLETED', handleRideCompleted);
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
      socketService.off('ride_arrived', handleRideArrived); // 🛡️ DEBRANCHE !
      socketService.off('ride_completed', handleRideCompleted);
      socketService.off('RIDE_COMPLETED', handleRideCompleted);
      socketService.off('ride_status_update', handleRideStatusUpdate);
      socketService.off('search_timeout', handleSearchTimeout);
      socketService.off('driver_location_update', handleDriverLocationUpdate);
    };
  }, [isAuthenticated, dispatch]);
};

export default useSocketEvents;