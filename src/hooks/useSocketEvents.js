// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Multiprise Modulaire
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socketService from '../services/socketService';
import { apiSlice } from '../store/slices/apiSlice';
import { updatePromoMode } from '../store/slices/authSlice';
import useAdminSocketEvents from './useAdminSocketEvents';
import usePoiSocketEvents from './usePoiSocketEvents';
import useReportSocketEvents from './useReportSocketEvents';
import useRideSocketEvents from './useRideSocketEvents';

const useSocketEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // ECOUTEUR DU MODE VIP / GRATUITE GLOBALE
    const handlePromoModeChange = (data) => {
      console.log("[SOCKET] Mode Promo Global mis a jour:", data);
      dispatch(updatePromoMode(data));
    };

    // CORRECTION SENIOR : ECOUTEUR DE LA PROMOTION CLASSIQUE (Invalidation cache)
    const handlePromoUpdated = (data) => {
      console.log("[SOCKET] Statut Promo Classique mis a jour:", data);
      dispatch(apiSlice.util.invalidateTags(['Stats', 'Subscription', 'SystemConfig']));
    };

    socketService.on('PROMO_MODE_CHANGED', handlePromoModeChange);
    socketService.on('promo_updated', handlePromoUpdated);

    return () => {
      socketService.off('PROMO_MODE_CHANGED', handlePromoModeChange);
      socketService.off('promo_updated', handlePromoUpdated);
    };
  }, [dispatch]);

  useRideSocketEvents();
  useAdminSocketEvents();
  useReportSocketEvents();
  usePoiSocketEvents();
};

export default useSocketEvents;