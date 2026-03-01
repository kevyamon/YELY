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
        message: data?.reason || 'Cette course a ete annulee.',
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
        message: 'Le client a accepte votre tarif. En route !',
      }));
    };

    const handleProposalRejected = () => {
      dispatch(clearIncomingRide());
      dispatch(showErrorToast({
        title: 'Prix refuse',
        message: 'Le client a decline votre proposition.',
      }));
    };

    const handleDriverFound = (data) => {
      dispatch(updateRideStatus({
        status: 'negotiating',
        driverName: data?.driverName || 'Un chauffeur',
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
      dispatch(updateRideStatus({
        status: 'ongoing',
        startedAt: data.startedAt,
      }));
    };

    const handleRideCompleted = (data) => {
      dispatch(setRideToRate(data));
      
      if (data?.stats) {
        dispatch(updateUserInfo({
          totalRides: data.stats.totalRides,
          totalEarnings: data.stats.totalEarnings,
          rating: data.stats.rating
        }));
      }

      dispatch(clearCurrentRide());

      dispatch(showSuccessToast({
        title: 'Course terminee',
        message: 'Vous etes arrive a destination.',
      }));
    };

    const handleRideStatusUpdate = (data) => {
      if (!data?.status) return;

      if (data.status === 'completed') {
        dispatch(setRideToRate(data.ride || data));
        dispatch(clearCurrentRide());
        dispatch(showSuccessToast({
          title: 'Course terminee',
          message: 'Vous etes arrive a destination.',
        }));
        return;
      }

      if (data.status === 'ongoing') {
        dispatch(updateRideStatus({
          status: 'ongoing',
          startedAt: data?.ride?.startedAt,
        }));
        return;
      }

      if (data.status === 'arrived') {
        dispatch(updateRideStatus({
          status: 'accepted',
          arrivedAt: Date.now(),
        }));
      }
    };

    const handleSearchTimeout = (data) => {
      dispatch(clearCurrentRide());
      dispatch(showErrorToast({
        title: 'Recherche expiree',
        message: data?.message || "Aucun chauffeur n'est disponible dans votre zone.",
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
    socketService.on('ride_completed', handleRideCompleted);
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
      socketService.off('ride_completed', handleRideCompleted);
      socketService.off('ride_status_update', handleRideStatusUpdate);
      socketService.off('search_timeout', handleSearchTimeout);
      socketService.off('driver_location_update', handleDriverLocationUpdate);
    };
  }, [isAuthenticated, dispatch]);
};

export default useSocketEvents;