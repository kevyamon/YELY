// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Inclusion des actions d'Administration Temps Reel
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { logout, selectIsAuthenticated, updateUserInfo } from '../store/slices/authSlice';
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

    // --- EVENEMENTS D'ADMINISTRATION (Temps Reel) ---

    const handleUserRoleUpdated = (data) => {
      if (data?.newRole) {
        dispatch(updateUserInfo({ role: data.newRole }));
        dispatch(showSuccessToast({
          title: 'Droits d\'acces modifies',
          message: `L'administration a mis a jour votre profil en tant que : ${data.newRole.toUpperCase()}.`
        }));
      }
    };

    const handleUserBanned = (data) => {
      dispatch(showErrorToast({
        title: 'Acces Revoque',
        message: data?.reason || 'Votre compte a ete suspendu par l\'administration.',
      }));
      // Kick immediat du systeme
      setTimeout(() => {
        dispatch(logout());
      }, 3000);
    };

    const handleUserUnbanned = () => {
      dispatch(updateUserInfo({ isBanned: false }));
      dispatch(showSuccessToast({
        title: 'Acces Restaure',
        message: 'L\'administration a leve la restriction sur votre compte.',
      }));
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
    socketService.on('ride_status_update', handleRideStatusUpdate);
    socketService.on('search_timeout', handleSearchTimeout);
    socketService.on('driver_location_update', handleDriverLocationUpdate);

    // Enregistrement des ecouteurs Admin
    socketService.on('user_role_updated', handleUserRoleUpdated);
    socketService.on('user_banned', handleUserBanned);
    socketService.on('user_unbanned', handleUserUnbanned);

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
      
      // Nettoyage des ecouteurs Admin
      socketService.off('user_role_updated', handleUserRoleUpdated);
      socketService.off('user_banned', handleUserBanned);
      socketService.off('user_unbanned', handleUserUnbanned);
    };
  }, [isAuthenticated, dispatch]);
};

export default useSocketEvents;