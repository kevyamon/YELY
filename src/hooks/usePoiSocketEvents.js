// src/hooks/usePoiSocketEvents.js
// HOOK DE TEMPS REEL - Modification chirurgicale de la RAM (Zero requete reseau)
// CSCSM Level: Bank Grade (Corrigé pour mutation pure Immer)

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { poiApiSlice } from '../store/api/poiApiSlice';
import { selectIsAuthenticated } from '../store/slices/authSlice';

const usePoiSocketEvents = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePoiUpdated = (payload) => {
      const { action, poi } = payload;

      if (action === 'bulk' || action === 'bulk_partial') {
        dispatch(poiApiSlice.util.invalidateTags(['POI']));
        return;
      }

      dispatch(
        poiApiSlice.util.updateQueryData('getAllPOIs', undefined, (draft) => {
          // Securite: On s'assure que le cache existe et que data est bien un tableau
          if (!draft || !Array.isArray(draft.data)) return;
          if (!poi) return;

          // Normalisation stricte de l'ID (Mongoose _id vs JSON id)
          const incomingId = String(poi._id || poi.id);

          if (action === 'create') {
            const exists = draft.data.find((p) => String(p._id || p.id) === incomingId);
            if (!exists && poi.isActive !== false) {
              // Mutation pure (Immer detecte le push et declenche le re-render)
              draft.data.push(poi);
            }
          } 
          else if (action === 'update') {
            const index = draft.data.findIndex((p) => String(p._id || p.id) === incomingId);
            
            if (index !== -1) {
              if (poi.isActive === false) {
                // Utilisation de splice au lieu de filter pour garantir le tracking Immer
                draft.data.splice(index, 1);
              } else {
                draft.data[index] = poi;
              }
            } else if (poi.isActive !== false) {
              draft.data.push(poi);
            }
          }
        })
      );
    };

    const handlePoiDeleted = (payload) => {
      const { id } = payload;
      if (!id) return;

      const targetId = String(id);

      dispatch(
        poiApiSlice.util.updateQueryData('getAllPOIs', undefined, (draft) => {
          if (!draft || !Array.isArray(draft.data)) return;
          
          const index = draft.data.findIndex((p) => String(p._id || p.id) === targetId);
          if (index !== -1) {
            // Mutation pure : ablation chirurgicale sans casser le Proxy Immer
            draft.data.splice(index, 1);
          }
        })
      );
    };

    socketService.on('poi_updated', handlePoiUpdated);
    socketService.on('poi_deleted', handlePoiDeleted);

    return () => {
      socketService.off('poi_updated', handlePoiUpdated);
      socketService.off('poi_deleted', handlePoiDeleted);
    };
  }, [isAuthenticated, dispatch]);
};

export default usePoiSocketEvents;