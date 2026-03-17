// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Multiprise Modulaire
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socketService from '../services/socketService';
import { apiSlice } from '../store/slices/apiSlice';
import { updatePromoMode, updateSubscriptionStatus } from '../store/slices/authSlice';
import useAdminSocketEvents from './useAdminSocketEvents';
import usePoiSocketEvents from './usePoiSocketEvents';
import useReportSocketEvents from './useReportSocketEvents';
import useRideSocketEvents from './useRideSocketEvents';

const useSocketEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handlePromoModeChange = (data) => {
      console.log("[SOCKET] Mode Promo Global mis a jour:", data);
      dispatch(updatePromoMode(data));
    };

    const handlePromoUpdated = (data) => {
      console.log("[SOCKET] Statut Promo Classique mis a jour:", data);
      dispatch(apiSlice.util.invalidateTags(['Stats', 'Subscription', 'SystemConfig']));
    };

    const handleSubscriptionRejected = (data) => {
      console.log("[SOCKET] Abonnement refuse:", data);
      dispatch(updateSubscriptionStatus({ isPending: false, isRejected: true, rejectionReason: data?.reason }));
    };

    const handleSubscriptionValidated = (data) => {
      console.log("[SOCKET] Abonnement valide:", data);
      dispatch(updateSubscriptionStatus({ isPending: false, isRejected: false, isActive: true, expiresAt: data?.expiresAt }));
      dispatch(apiSlice.util.invalidateTags(['Subscription', 'User', 'Stats']));
    };

    socketService.on('PROMO_MODE_CHANGED', handlePromoModeChange);
    socketService.on('promo_updated', handlePromoUpdated);
    socketService.on('subscription_rejected', handleSubscriptionRejected);
    socketService.on('subscription_validated', handleSubscriptionValidated);

    return () => {
      socketService.off('PROMO_MODE_CHANGED', handlePromoModeChange);
      socketService.off('promo_updated', handlePromoUpdated);
      socketService.off('subscription_rejected', handleSubscriptionRejected);
      socketService.off('subscription_validated', handleSubscriptionValidated);
    };
  }, [dispatch]);

  useRideSocketEvents();
  useAdminSocketEvents();
  useReportSocketEvents();
  usePoiSocketEvents();
};

export default useSocketEvents;