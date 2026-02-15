// src/hooks/useSocketEvents.js
// Orchestrateur des événements Socket (Rider & Driver)

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
    if (!isAuthenticated) return;

    // --- HANDLERS (Gestionnaires d'événements) ---

    // 1. Gestion des Courses
    const handleRideEvents = {
      request: (data) => {
        dispatch(openModal({ type: 'rideRequest', position: 'center', data }));
      },
      accepted: (data) => {
        if (data.ride) dispatch(setCurrentRide(data.ride));
        if (data.driver) dispatch(setAssignedDriver(data.driver));
        dispatch(setRideStatus('accepted'));
        dispatch(showToast({
          type: 'success',
          title: 'Chauffeur trouvé !',
          message: `${data.driver?.name || 'Le chauffeur'} arrive.`
        }));
      },
      cancelled: (data) => {
        dispatch(setRideStatus('cancelled'));
        dispatch(showToast({
          type: 'warning',
          title: 'Course annulée',
          message: data.reason || 'La course a été annulée.'
        }));
      },
      started: () => {
        dispatch(setRideStatus('ongoing'));
        dispatch(showToast({ title: 'Course démarrée', message: 'Bon voyage !' }));
      },
      completed: (data) => {
        dispatch(setRideStatus('completed'));
        if (data?.ride) dispatch(setCurrentRide(data.ride));
        dispatch(showToast({ type: 'success', title: 'Arrivée', message: 'Course terminée.' }));
      }
    };

    // 2. Tracking & Proximité
    const handleLocationEvents = {
      driverUpdate: (data) => {
        if (data?.latitude && data?.longitude) {
          dispatch(updateDriverLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            heading: data.heading || 0,
          }));
        }
      },
      driverArrived: (data) => {
        dispatch(showToast({
          type: 'success',
          title: 'Votre Yély est là',
          message: data.message || 'Le chauffeur vous attend.'
        }));
      },
      pancarte: (data) => {
        dispatch(showToast({
          type: 'info',
          title: 'Signal lumineux',
          message: `${data.senderName} vous fait signe !`
        }));
      }
    };

    // 3. Admin & Système
    const handleSystemEvents = {
      notification: (data) => {
        dispatch(showToast({
          type: data.type || 'info',
          title: data.title || 'Info',
          message: data.message
        }));
      },
      subscription: (data) => {
        dispatch(showToast({
          type: 'success',
          title: 'Abonnement Validé',
          message: `Forfait ${data.plan} actif.`
        }));
      },
      proof: (data) => {
        dispatch(showToast({
          type: 'info',
          title: 'Finance',
          message: 'Nouvelle preuve de paiement reçue.'
        }));
      }
    };

    // --- SUBSCRIPTIONS (Abonnements aux canaux) ---
    
    // Courses
    socketService.on('new_ride_request', handleRideEvents.request);
    socketService.on('ride_accepted', handleRideEvents.accepted);
    socketService.on('ride_cancelled', handleRideEvents.cancelled);
    socketService.on('ride_started', handleRideEvents.started);
    socketService.on('ride_completed', handleRideEvents.completed);

    // Location
    socketService.on('driver_location_update', handleLocationEvents.driverUpdate);
    socketService.on('driver_arrived', handleLocationEvents.driverArrived);
    socketService.on('pancarte_active', handleLocationEvents.pancarte);

    // Système
    socketService.on('notification', handleSystemEvents.notification);
    socketService.on('subscription_validated', handleSystemEvents.subscription);
    socketService.on('new_proof_submitted', handleSystemEvents.proof);

    // --- CLEANUP ---
    return () => {
      // On détache proprement tous les listeners à la fin
      socketService.off('new_ride_request', handleRideEvents.request);
      socketService.off('ride_accepted', handleRideEvents.accepted);
      socketService.off('ride_cancelled', handleRideEvents.cancelled);
      socketService.off('ride_started', handleRideEvents.started);
      socketService.off('ride_completed', handleRideEvents.completed);
      socketService.off('driver_location_update', handleLocationEvents.driverUpdate);
      socketService.off('driver_arrived', handleLocationEvents.driverArrived);
      socketService.off('pancarte_active', handleLocationEvents.pancarte);
      socketService.off('notification', handleSystemEvents.notification);
      socketService.off('subscription_validated', handleSystemEvents.subscription);
      socketService.off('new_proof_submitted', handleSystemEvents.proof);
    };
  }, [isAuthenticated, dispatch]);
};

export default useSocketEvents;