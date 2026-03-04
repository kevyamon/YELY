// src/hooks/usePoiSocketEvents.js [NOUVEAU]
// HOOK DE TEMPS RÉEL - Écoute des événements de lieux (POI)
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { poiApiSlice } from '../store/api/poiApiSlice';
import useSocket from './useSocket';

const usePoiSocketEvents = () => {
  const { socket, isConnected } = useSocket();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Quand un POI est créé, modifié ou importé en masse
    const handlePoiUpdated = () => {
      // On invalide le cache RTK Query pour forcer le rechargement transparent
      dispatch(poiApiSlice.util.invalidateTags(['POI']));
    };

    // Quand un POI est supprimé
    const handlePoiDeleted = () => {
      dispatch(poiApiSlice.util.invalidateTags(['POI']));
    };

    // Inscription aux événements
    socket.on('poi_updated', handlePoiUpdated);
    socket.on('poi_deleted', handlePoiDeleted);

    // Nettoyage à la destruction du hook
    return () => {
      socket.off('poi_updated', handlePoiUpdated);
      socket.off('poi_deleted', handlePoiDeleted);
    };
  }, [socket, isConnected, dispatch]);
};

export default usePoiSocketEvents;