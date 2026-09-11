// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Multiprise Modulaire (Correction temps reel admin)
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { playSound } from '../utils/soundHelper';
import socketService from '../services/socketService';
import { apiSlice } from '../store/slices/apiSlice';
import { logout, updatePromoMode, updateSubscriptionStatus, updateUserInfo } from '../store/slices/authSlice';
import { showSuccessToast } from '../store/slices/uiSlice'; // AJOUT : Import du Toast
import useAdminSocketEvents from './useAdminSocketEvents';
import usePoiSocketEvents from './usePoiSocketEvents';
import useReportSocketEvents from './useReportSocketEvents';
import useRideSocketEvents from './useRideSocketEvents';
import useCallSocketEvents from './useCallSocketEvents';

const useSocketEvents = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

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
      dispatch(updateSubscriptionStatus({ isActive: false, isPending: false, isRejected: true, rejectionReason: data?.reason || null }));
      dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
    };

    const handleSubscriptionValidated = (data) => {
      console.info("[SOCKET] Abonnement active en temps reel:", data);
      dispatch(updateSubscriptionStatus({ 
        isActive: true, 
        isPending: false, 
        isRejected: false, 
        rejectionReason: null,
        expiresAt: data?.expiresAt || null
      }));
      dispatch(showSuccessToast({
        title: "Abonnement Actif",
        message: "Votre Passe Yely est desormais confirme et actif."
      }));
      dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
    };

    const handleIdentityUpdate = (data) => {
      console.info("[SOCKET] Mise a jour identite recue:", data);
      dispatch(updateUserInfo({ verificationStatus: data.status, rejectionReason: data.reason || null }));
    };

    const handleUserBanned = () => {
      console.warn("[SOCKET] Utilisateur banni en direct ! Ejection.");
      dispatch(logout());
    };

    const handleForceLogout = () => {
      console.warn("[SOCKET] Droits revoques en direct ! Ejection.");
      dispatch(logout());
    };

    const handleNewOrder = async (data) => {
      console.info("[SOCKET] Nouvelle commande recue:", data);
      dispatch(apiSlice.util.invalidateTags(['Order']));
      dispatch(showSuccessToast({
        title: "Nouvelle commande",
        message: `Commande #${data.orderId?.slice(-6)} recue.`
      }));

      try {
        playSound('new_order');
      } catch (err) {
        console.warn("[SOCKET] Echec lecture son nouvelle commande:", err);
      }
    };

    const handleNotificationReceived = (data) => {
      console.info("[SOCKET] Notification recue:", data);
      dispatch(apiSlice.util.invalidateTags(['Notification']));
    };

    socketService.on('PROMO_MODE_CHANGED', handlePromoModeChange);
    socketService.on('promo_updated', handlePromoUpdated);
    socketService.on('subscription_updated', handleSubscriptionValidated);
    socketService.on('subscription_validated', handleSubscriptionValidated);
    socketService.on('subscription_failed', handleSubscriptionRejected);
    socketService.on('subscription_rejected', handleSubscriptionRejected);
    socketService.on('identity_verification_update', handleIdentityUpdate);
    socketService.on('user_banned', handleUserBanned);
    socketService.on('force_logout', handleForceLogout);
    socketService.on('new_order', handleNewOrder);
    socketService.on('notification_received', handleNotificationReceived);

    return () => {
      socketService.off('PROMO_MODE_CHANGED', handlePromoModeChange);
      socketService.off('promo_updated', handlePromoUpdated);
      socketService.off('subscription_updated', handleSubscriptionValidated);
      socketService.off('subscription_validated', handleSubscriptionValidated);
      socketService.off('subscription_failed', handleSubscriptionRejected);
      socketService.off('subscription_rejected', handleSubscriptionRejected);
      socketService.off('identity_verification_update', handleIdentityUpdate);
      socketService.off('user_banned', handleUserBanned);
      socketService.off('force_logout', handleForceLogout);
      socketService.off('new_order', handleNewOrder);
      socketService.off('notification_received', handleNotificationReceived);
    };
  }, [isAuthenticated, dispatch]);

  useRideSocketEvents();
  useAdminSocketEvents();
  useReportSocketEvents();
  usePoiSocketEvents();
  useCallSocketEvents();
};

export default useSocketEvents;