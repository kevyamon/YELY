// src/hooks/useRideSocketEvents.js
// ECOUTEURS SOCKET - Gestion Robuste des Profils et Annulations d'Urgence
// STANDARD: Industriel / Bank Grade

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { selectCurrentUser, selectIsAuthenticated, updateUserInfo } from '../store/slices/authSlice';
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

const useRideSocketEvents = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const lastProcessedEventRef = useRef('');

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      socketService.joinRoom(user._id.toString());
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const isDuplicateEvent = (eventKey) => {
      if (lastProcessedEventRef.current === eventKey) return true;
      lastProcessedEventRef.current = eventKey;
      return false;
    };

    const handleRideCancelled = (data) => {
      const uniqueId = data?.rideId || Date.now().toString();
      if (isDuplicateEvent(`cancelled_${uniqueId}`)) return;
      
      dispatch(clearCurrentRide());
      dispatch(clearIncomingRide());
      dispatch(showErrorToast({
        title: 'Course annulee',
        message: data?.message || data?.reason || 'Annulation confirmee par le serveur.',
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
        driverProfilePicture: data?.driverProfilePicture 
      }));
    };

    const handlePriceProposal = (data) => {
      dispatch(setCurrentRide({
        proposedPrice: data.amount,
        driverName: data.driverName,
        driverProfilePicture: data.driverProfilePicture, 
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
      if (['completed', 'arrived', 'in_progress', 'accepted', 'cancelled'].includes(data.status)) return;
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
        lat = data.latitude; lng = data.longitude; heading = data.heading;
      } else if (data.location && data.location.coordinates) {
        lat = data.location.coordinates[1]; lng = data.location.coordinates[0]; heading = data.heading;
      } else if (data.coordinates) {
        lat = data.coordinates[1]; lng = data.coordinates[0]; heading = data.heading;
      }

      if (lat && lng) {
        dispatch(updateDriverLocation({ latitude: Number(lat), longitude: Number(lng), heading: heading || 0 }));
      }
    };

    // CORRECTION SENIOR : Interception du verrouillage serveur pour les abonnements expires
    const handleForceSubscriptionLock = (data) => {
      if (isDuplicateEvent('force_sub_lock')) return;
      dispatch(updateUserInfo({ subscriptionStatus: 'inactive' }));
      dispatch(showErrorToast({
        title: 'Abonnement Requis',
        message: data?.message || 'Votre periode de grace est terminee. Veuillez activer un Pass Yely.',
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
    socketService.on('FORCE_SUBSCRIPTION_LOCK', handleForceSubscriptionLock);

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
      socketService.off('FORCE_SUBSCRIPTION_LOCK', handleForceSubscriptionLock);
    };
  }, [isAuthenticated, dispatch]);
};

export default useRideSocketEvents;