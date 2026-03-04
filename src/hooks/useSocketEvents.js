// src/hooks/useSocketEvents.js
// ECOUTEURS SOCKET - Multiprise Modulaire
// CSCSM Level: Bank Grade

import useAdminSocketEvents from './useAdminSocketEvents';
import usePoiSocketEvents from './usePoiSocketEvents';
import useReportSocketEvents from './useReportSocketEvents';
import useRideSocketEvents from './useRideSocketEvents';

const useSocketEvents = () => {
  // On branche tous nos câbles spécialisés, y compris les lieux (POI)
  useRideSocketEvents();
  useAdminSocketEvents();
  useReportSocketEvents();
  usePoiSocketEvents();
};

export default useSocketEvents;