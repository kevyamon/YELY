// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Multiprise Modulaire (Correction temps reel admin)
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socketService from '../services/socketService';
import { apiSlice } from '../store/slices/apiSlice';
import { logout, updatePromoMode, updateSubscriptionStatus } from '../store/slices/authSlice';
import { showSuccessToast } from '../store/slices/uiSlice'; // AJOUT : Import du Toast
import useAdminSocketEvents from './useAdminSocketEvents';
import usePoiSocketEvents from './usePoiSocketEvents';
import useReportSocketEvents from './useReportSocketEvents';
import useRideSocketEvents from './useRideSocketEvents';

const useSocketEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handlePromoModeChange = (data) => {
      console.info("[SOCKET] Mode Promo Global mis a jour:", data);
      dispatch(updatePromoMode(data));
    };

    const handlePromoUpdated = (data) => {
      console.info("[SOCKET] Statut Promo Classique mis a jour:", data);
      dispatch(apiSlice.util.invalidateTags(['Stats', 'Subscription', 'SystemConfig']));
    };

    const handleSubscriptionRejected = (data) => {
      console.info("[SOCKET] Abonnement refuse:", data);
      dispatch(updateSubscriptionStatus({ isPending: false, isRejected: true, rejectionReason: data?.reason }));
      dispatch(apiSlice.util.invalidateTags(['Subscription']));
    };

    const handleSubscriptionValidated = (data) => {
      console.info("[SOCKET] Abonnement valide:", data);
      dispatch(updateSubscriptionStatus({ isPending: false, isRejected: false, isActive: true, expiresAt: data?.expiresAt }));
      dispatch(apiSlice.util.invalidateTags(['Subscription', 'User', 'Stats']));
      
      // AJOUT : Notification globale informant de l'activation, visible n'importe où dans l'app
      dispatch(showSuccessToast({ 
        title: "Pass Yely Actif", 
        message: "Votre abonnement a ete valide avec succes." 
      }));
    };

    const handleUserBanned = (data) => {
      console.warn("[SOCKET] Utilisateur banni en direct ! Ejection.");
      dispatch(logout({ reason: 'BANNED_BY_ADMIN' }));
    };

    const handleForceLogout = (data) => {
      console.warn("[SOCKET] Droits revoques en direct ! Ejection.");
      dispatch(logout({ reason: 'RIGHTS_REVOKED_BY_ADMIN' }));
    };

    const handleNewOrder = (data) => {
      console.info("[SOCKET] Nouvelle commande recue:", data);
      dispatch(showSuccessToast({ 
        title: "Nouvelle Commande ! 🛍️", 
        message: `Vous avez reçu une commande de ${data?.totalPrice?.toLocaleString() || '...'} F.` 
      }));
      dispatch(apiSlice.util.invalidateTags(['Notification', 'Order', 'Stats']));
    };

    const handleNotificationReceived = (data) => {
      console.info("[SOCKET] Notification recue:", data);
      dispatch(apiSlice.util.invalidateTags(['Notification']));
    };

    socketService.on('PROMO_MODE_CHANGED', handlePromoModeChange);
    socketService.on('promo_updated', handlePromoUpdated);
    socketService.on('subscription_rejected', handleSubscriptionRejected);
    socketService.on('subscription_validated', handleSubscriptionValidated);
    socketService.on('user_banned', handleUserBanned);
    socketService.on('force_logout', handleForceLogout);
    socketService.on('new_order', handleNewOrder);
    socketService.on('notification_received', handleNotificationReceived);

    return () => {
      socketService.off('PROMO_MODE_CHANGED', handlePromoModeChange);
      socketService.off('promo_updated', handlePromoUpdated);
      socketService.off('subscription_rejected', handleSubscriptionRejected);
      socketService.off('subscription_validated', handleSubscriptionValidated);
      socketService.off('user_banned', handleUserBanned);
      socketService.off('force_logout', handleForceLogout);
      socketService.off('new_order', handleNewOrder);
      socketService.off('notification_received', handleNotificationReceived);
    };
  }, [dispatch]);

  useRideSocketEvents();
  useAdminSocketEvents();
  useReportSocketEvents();
  usePoiSocketEvents();
};

export default useSocketEvents;