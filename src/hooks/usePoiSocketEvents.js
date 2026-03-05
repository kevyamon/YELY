// src/hooks/usePoiSocketEvents.js
// HOOK DE TEMPS RÉEL - Modification chirurgicale de la RAM (Zéro requête réseau)
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

    // Écouteur pour la création, modification et import de masse
    const handlePoiUpdated = (payload) => {
      const { action, poi } = payload;

      // Pour un import de masse, on conserve l'invalidation car le delta de données est trop vaste
      if (action === 'bulk' || action === 'bulk_partial') {
        dispatch(poiApiSlice.util.invalidateTags(['POI']));
        return;
      }

      // MODIFICATION CHIRURGICALE EN RAM
      dispatch(
        poiApiSlice.util.updateQueryData('getAllPOIs', undefined, (draft) => {
          // 'draft' est la copie exacte du cache actuel. On la mute directement.
          if (!draft || !draft.data) return;

          if (action === 'create' && poi) {
            // Sécurité : on s'assure qu'il n'existe pas déjà et qu'il est actif
            const exists = draft.data.find((p) => p._id === poi._id);
            if (!exists && poi.isActive) {
              draft.data.push(poi);
            }
          } 
          
          else if (action === 'update' && poi) {
            const index = draft.data.findIndex((p) => p._id === poi._id);
            
            if (index !== -1) {
              // Si le lieu a été désactivé par l'admin, on le retire de l'affichage
              if (poi.isActive === false) {
                draft.data.splice(index, 1);
              } else {
                // Sinon on met à jour ses données (nom, coordonnées, icône)
                draft.data[index] = poi;
              }
            } else if (poi.isActive) {
              // S'il était inactif (donc absent du cache) et qu'il est réactivé
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
          // On filtre le tableau pour éjecter le lieu supprimé
          draft.data = draft.data.filter((p) => p._id !== id);
        })
      );
    };

    // Inscription aux événements Socket.io
    socket.on('poi_updated', handlePoiUpdated);
    socket.on('poi_deleted', handlePoiDeleted);

    // Nettoyage rigoureux à la destruction du composant
    return () => {
      socket.off('poi_updated', handlePoiUpdated);
      socket.off('poi_deleted', handlePoiDeleted);
    };
  }, [socket, isConnected, dispatch]);
};

export default usePoiSocketEvents;