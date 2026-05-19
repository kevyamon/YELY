// src/hooks/useMarketplaceSocketEvents.js
// HOOK TEMPS RÉEL MARKETPLACE - Synchronisation complète (API Cache + Cart Redux)
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socketService from '../services/socketService';
import { marketplaceApiSlice } from '../store/api/marketplaceApiSlice';
import { updateCartItemInfo } from '../store/slices/cartSlice';

const useMarketplaceSocketEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    /**
     * Gère la création ou la mise à jour d'un produit.
     * Stratégie : On invalide le tag 'Product' pour forcer un re-fetch propre
     * de TOUTES les queries (getProducts, getMyProducts, getProduct), peu importe
     * les arguments (category, search, etc.) qui varient d'une page à l'autre.
     * On met également à jour le panier si le produit modifié s'y trouve.
     */
    const handleProductUpdated = (product) => {
      if (!product) return;

      const prodId = String(product._id || product.id);

      // 1. Mise à jour instantanée du cache local RTK Query (0ms de latence UI)
      dispatch(
        marketplaceApiSlice.util.updateQueryData('getProduct', prodId, (draft) => {
          if (draft && draft.data) {
            draft.data.stockCount = product.stockCount;
            draft.data.isSoldOut = product.isSoldOut;
            draft.data.manageStock = product.manageStock;
          }
        })
      );

      // 2. Invalider le cache RTK Query pour toutes les listes de produits (refetch de sécurité)
      dispatch(marketplaceApiSlice.util.invalidateTags(['Product']));

      // 3. Synchroniser le panier Redux avec les nouvelles infos (prix, nom, image, statut de rupture)
      dispatch(updateCartItemInfo({
        id: prodId,
        changes: {
          name: product.name,
          price: product.price,
          image: product.images?.[0] || product.image,
        }
      }));
    };

    /**
     * Gère la suppression d'un produit.
     * On invalide le tag 'Product' pour nettoyer toutes les listes.
     */
    const handleProductDeleted = (productId) => {
      if (!productId) return;
      dispatch(marketplaceApiSlice.util.invalidateTags(['Product']));
    };

    const handleBannersUpdated = () => {
      dispatch(marketplaceApiSlice.util.invalidateTags(['Banner']));
    };

    socketService.on('product_created', handleProductUpdated);
    socketService.on('product_updated', handleProductUpdated);
    socketService.on('product_deleted', handleProductDeleted);
    socketService.on('banners_updated', handleBannersUpdated);

    return () => {
      socketService.off('product_created', handleProductUpdated);
      socketService.off('product_updated', handleProductUpdated);
      socketService.off('product_deleted', handleProductDeleted);
      socketService.off('banners_updated', handleBannersUpdated);
    };
  }, [dispatch]);
};

export default useMarketplaceSocketEvents;
