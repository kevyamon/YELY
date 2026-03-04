// src/hooks/usePoiSocketEvents.js
// HOOK DE TEMPS RÉEL - Écoute des événements de lieux (POI)
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { apiSlice } from '../store/slices/apiSlice'; // CRITIQUE: Import de l'apiSlice global
import useSocket from './useSocket';

const usePoiSocketEvents = () => {
  const { socket, isConnected } = useSocket();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Quand un POI est créé, modifié ou importé en masse
    const handlePoiUpdated = () => {
      // On utilise l'apiSlice global pour être certain que l'invalidation est prise en compte
      dispatch(apiSlice.util.invalidateTags(['POI']));
    };

    // Quand un POI est supprimé
    const handlePoiDeleted = () => {
      dispatch(apiSlice.util.invalidateTags(['POI']));
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