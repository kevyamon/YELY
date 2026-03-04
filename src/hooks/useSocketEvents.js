// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Multiprise Modulaire
// CSCSM Level: Bank Grade

import useAdminSocketEvents from './useAdminSocketEvents';
import useReportSocketEvents from './useReportSocketEvents';
import useRideSocketEvents from './useRideSocketEvents';

const useSocketEvents = () => {
  // On branche simplement nos 3 câbles spécialisés !
  useRideSocketEvents();
  useAdminSocketEvents();
  useReportSocketEvents();
};

export default useSocketEvents;