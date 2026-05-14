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

      // 1. Invalider le cache RTK Query pour toutes les listes de produits
      dispatch(marketplaceApiSlice.util.invalidateTags(['Product']));

      // 2. Synchroniser le panier Redux avec les nouvelles infos (prix, nom, image)
      dispatch(updateCartItemInfo({
        id: String(product._id || product.id),
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
