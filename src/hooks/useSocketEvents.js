// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Multiprise Modulaire
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socketService from '../services/socketService';
import { updatePromoMode } from '../store/slices/authSlice';
import useAdminSocketEvents from './useAdminSocketEvents';
import usePoiSocketEvents from './usePoiSocketEvents';
import useReportSocketEvents from './useReportSocketEvents';
import useRideSocketEvents from './useRideSocketEvents';

const useSocketEvents = () => {
  const dispatch = useDispatch();

  // 🔥 ECOUTEUR GLOBAL DU MODE VIP / PROMO
  useEffect(() => {
    const handlePromoModeChange = (data) => {
      console.log("[SOCKET] Mode Promo mis a jour:", data);
      dispatch(updatePromoMode(data));
    };

    socketService.on('PROMO_MODE_CHANGED', handlePromoModeChange);

    return () => {
      socketService.off('PROMO_MODE_CHANGED', handlePromoModeChange);
    };
  }, [dispatch]);

  useRideSocketEvents();
  useAdminSocketEvents();
  useReportSocketEvents();
  usePoiSocketEvents();
};

export default useSocketEvents;