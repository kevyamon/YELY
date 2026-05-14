// src/hooks/useMarketplaceSocketEvents.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socketService from '../services/socketService';
import { marketplaceApiSlice } from '../store/api/marketplaceApiSlice';

const useMarketplaceSocketEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleProductUpdated = (product) => {
      if (!product) return;
      const incomingId = String(product._id || product.id);

      // Mise à jour de la liste globale (Marketplace)
      dispatch(
        marketplaceApiSlice.util.updateQueryData('getProducts', undefined, (draft) => {
          if (!draft || !Array.isArray(draft.data)) return;
          
          const index = draft.data.findIndex((p) => String(p._id || p.id) === incomingId);
          if (index !== -1) {
            draft.data[index] = { ...draft.data[index], ...product };
          } else {
            draft.data.push(product);
          }
        })
      );

      // Mise à jour du produit spécifique si quelqu'un est sur ProductDetails
      dispatch(
        marketplaceApiSlice.util.updateQueryData('getProduct', incomingId, (draft) => {
          if (draft && draft.data) {
            draft.data = { ...draft.data, ...product };
          }
        })
      );
    };

    const handleProductDeleted = (productId) => {
      if (!productId) return;
      const targetId = String(productId);

      dispatch(
        marketplaceApiSlice.util.updateQueryData('getProducts', undefined, (draft) => {
          if (!draft || !Array.isArray(draft.data)) return;
          const index = draft.data.findIndex((p) => String(p._id || p.id) === targetId);
          if (index !== -1) {
            draft.data.splice(index, 1);
          }
        })
      );
    };

    socketService.on('product_created', handleProductUpdated);
    socketService.on('product_updated', handleProductUpdated);
    socketService.on('product_deleted', handleProductDeleted);

    return () => {
      socketService.off('product_created', handleProductUpdated);
      socketService.off('product_updated', handleProductUpdated);
      socketService.off('product_deleted', handleProductDeleted);
    };
  }, [dispatch]);
};

export default useMarketplaceSocketEvents;
