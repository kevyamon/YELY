// src/hooks/usePoiSocketEvents.js
// HOOK DE TEMPS RÉEL - Modification chirurgicale de la RAM (Zéro requête réseau)
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { poiApiSlice } from '../store/api/poiApiSlice';
import { selectIsAuthenticated } from '../store/slices/authSlice';

const usePoiSocketEvents = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    // Sécurité : On s'assure que l'utilisateur est bien connecté avant de tendre l'oreille
    if (!isAuthenticated) return;

    // Écouteur pour la création, modification et import de masse
    const handlePoiUpdated = (payload) => {
      const { action, poi } = payload;

      // Pour un import de masse, on efface l'ardoise et on recharge tout proprement
      if (action === 'bulk' || action === 'bulk_partial') {
        dispatch(poiApiSlice.util.invalidateTags(['POI']));
        return;
      }

      // MODIFICATION CHIRURGICALE EN RAM
      dispatch(
        poiApiSlice.util.updateQueryData('getAllPOIs', undefined, (draft) => {
          // 'draft' est le contenu actuel de notre mémoire locale
          if (!draft || !draft.data) return;

          if (action === 'create' && poi) {
            // On vérifie qu'on ne l'a pas déjà et qu'il est actif avant de l'ajouter
            const exists = draft.data.find((p) => p._id === poi._id);
            if (!exists && poi.isActive) {
              draft.data.push(poi);
            }
          } 
          else if (action === 'update' && poi) {
            const index = draft.data.findIndex((p) => p._id === poi._id);
            
            if (index !== -1) {
              // S'il est devenu inactif, on le retire de l'écran
              if (poi.isActive === false) {
                draft.data.splice(index, 1);
              } else {
                // Sinon on met à jour ses nouvelles coordonnées/infos
                draft.data[index] = poi;
              }
            } else if (poi.isActive) {
              // S'il n'était pas là (inactif) et qu'il a été réactivé
              draft.data.push(poi);
            }
          }
        })
      );
    };

    // Écouteur pour la suppression stricte
    const handlePoiDeleted = (payload) => {
      const { id } = payload;
      if (!id) return;

      // SUPPRESSION CHIRURGICALE EN RAM
      dispatch(
        poiApiSlice.util.updateQueryData('getAllPOIs', undefined, (draft) => {
          if (!draft || !draft.data) return;
          // On garde tous les lieux SAUF celui qui vient d'être supprimé
          draft.data = draft.data.filter((p) => p._id !== id);
        })
      );
    };

    // On branche officiellement nos câbles sur la multiprise centrale
    socketService.on('poi_updated', handlePoiUpdated);
    socketService.on('poi_deleted', handlePoiDeleted);

    // On débranche proprement quand on quitte l'application ou l'écran
    return () => {
      socketService.off('poi_updated', handlePoiUpdated);
      socketService.off('poi_deleted', handlePoiDeleted);
    };
  }, [isAuthenticated, dispatch]);
};

export default usePoiSocketEvents;