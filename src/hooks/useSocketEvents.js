// src/hooks/useSocketEvents.js
// Branche les listeners métier sur le socket (courses, notifications, GPS, etc.)

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import socketService from '../services/socketService';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import {
    setAssignedDriver,
    setCurrentRide,
    setRideStatus,
    updateDriverLocation,
} from '../store/slices/rideSlice';
import {
    openModal,
    showToast,
} from '../store/slices/uiSlice';

const useSocketEvents = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    // Ne rien brancher si pas authentifié
    if (!isAuthenticated) return;

    // ═══════════════════════════════════════
    // ÉVÉNEMENTS COURSE
    // ═══════════════════════════════════════

    const handleNewRideRequest = (data) => {
      console.log('[Socket] 🚕 Nouvelle demande de course:', data);
      dispatch(openModal({
        type: 'rideRequest',
        position: 'center',
        data,
      }));
    };

    const handleRideAccepted = (data) => {
      console.log('[Socket] ✅ Course acceptée:', data);
      if (data.ride) {
        dispatch(setCurrentRide(data.ride));
      }
      if (data.driver) {
        dispatch(setAssignedDriver(data.driver));
      }
      dispatch(setRideStatus('accepted'));
      dispatch(showToast({
        type: 'success',
        title: 'Course acceptée !',
        message: `${data.driver?.name || 'Un chauffeur'} arrive dans ~${data.estimatedTime || '?'} min`,
      }));
    };

    const handleRideCancelled = (data) => {
      console.log('[Socket] ❌ Course annulée:', data);
      dispatch(setRideStatus('cancelled'));
      dispatch(showToast({
        type: 'warning',
        title: 'Course annulée',
        message: data.reason || 'La course a été annulée.',
      }));
    };

    const handleRideStarted = (data) => {
      console.log('[Socket] 🚗 Course démarrée');
      dispatch(setRideStatus('ongoing'));
      dispatch(showToast({
        type: 'info',
        title: 'C\'est parti !',
        message: 'Votre course est en route.',
      }));
    };

    const handleRideCompleted = (data) => {
      console.log('[Socket] 🏁 Course terminée');
      dispatch(setRideStatus('completed'));
      if (data?.ride) {
        dispatch(setCurrentRide(data.ride));
      }
      dispatch(showToast({
        type: 'success',
        title: 'Course terminée',
        message: 'Merci d\'avoir voyagé avec Yély !',
      }));
    };

    // ═══════════════════════════════════════
    // TRACKING GPS DU CHAUFFEUR
    // ═══════════════════════════════════════

    const handleDriverLocationUpdate = (data) => {
      if (data && data.latitude && data.longitude) {
        dispatch(updateDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading || 0,
        }));
      }
    };

    // ═══════════════════════════════════════
    // PROXIMITÉ & PANCARTE
    // ═══════════════════════════════════════

    const handleDriverArrived = (data) => {
      console.log('[Socket] 📍 Chauffeur arrivé !');
      dispatch(showToast({
        type: 'success',
        title: 'Votre Yély est là !',
        message: data.message || 'Le chauffeur est à proximité.',
        duration: 5000,
      }));
    };

    const handlePancarteActive = (data) => {
      console.log('[Socket] ✨ Pancarte activée par:', data.senderName);
      dispatch(showToast({
        type: 'info',
        title: 'Pancarte activée',
        message: data.message || `${data.senderName} a activé sa pancarte.`,
        duration: 5000,
      }));
    };

    // ═══════════════════════════════════════
    // NOTIFICATIONS GÉNÉRALES
    // ═══════════════════════════════════════

    const handleNotification = (data) => {
      dispatch(showToast({
        type: data.type || 'info',
        title: data.title || 'Notification',
        message: data.message || '',
      }));
    };

    // ═══════════════════════════════════════
    // ABONNEMENT
    // ═══════════════════════════════════════

    const handleSubscriptionValidated = (data) => {
      dispatch(showToast({
        type: 'success',
        title: 'Abonnement activé ! 🎉',
        message: `Votre abonnement ${data.plan || ''} est maintenant actif.`,
        duration: 5000,
      }));
    };

    // ═══════════════════════════════════════
    // ADMIN — Alertes
    // ═══════════════════════════════════════

    const handleNewProofSubmitted = (data) => {
      dispatch(showToast({
        type: 'info',
        title: 'Nouvelle preuve reçue',
        message: `${data.driverName || 'Un chauffeur'} a soumis une preuve de paiement.`,
      }));
    };

    // ═══════════════════════════════════════
    // BRANCHEMENT DE TOUS LES LISTENERS
    // ═══════════════════════════════════════

    socketService.on('new_ride_request', handleNewRideRequest);
    socketService.on('ride_accepted', handleRideAccepted);
    socketService.on('ride_cancelled', handleRideCancelled);
    socketService.on('ride_started', handleRideStarted);
    socketService.on('ride_completed', handleRideCompleted);
    socketService.on('driver_location_update', handleDriverLocationUpdate);
    socketService.on('driver_arrived', handleDriverArrived);
    socketService.on('pancarte_active', handlePancarteActive);
    socketService.on('notification', handleNotification);
    socketService.on('subscription_validated', handleSubscriptionValidated);
    socketService.on('new_proof_submitted', handleNewProofSubmitted);

    // ═══════════════════════════════════════
    // CLEANUP — Retirer tous les listeners
    // ═══════════════════════════════════════

    return () => {
      socketService.off('new_ride_request', handleNewRideRequest);
      socketService.off('ride_accepted', handleRideAccepted);
      socketService.off('ride_cancelled', handleRideCancelled);
      socketService.off('ride_started', handleRideStarted);
      socketService.off('ride_completed', handleRideCompleted);
      socketService.off('driver_location_update', handleDriverLocationUpdate);
      socketService.off('driver_arrived', handleDriverArrived);
      socketService.off('pancarte_active', handlePancarteActive);
      socketService.off('notification', handleNotification);
      socketService.off('subscription_validated', handleSubscriptionValidated);
      socketService.off('new_proof_submitted', handleNewProofSubmitted);
    };
  }, [isAuthenticated, dispatch]);
};

export default useSocketEvents;