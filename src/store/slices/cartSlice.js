// src/store/slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalAmount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity } = action.payload;
      const existingItem = state.items.find(item => item.id === product._id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0],
          sellerId: product.seller?._id,
          sellerName: product.seller?.name,
          quantity: quantity
        });
      }
      
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item && quantity > 0) {
        item.quantity = quantity;
      }
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
    },

    /**
     * Met à jour les informations (prix, nom, image) d'un article déjà
     * dans le panier lorsque le vendeur modifie le produit en temps réel.
     */
    updateCartItemInfo: (state, action) => {
      const { id, changes } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (!item) return; // Produit pas dans le panier, on ignore

      if (changes.name !== undefined) item.name = changes.name;
      if (changes.image !== undefined) item.image = changes.image;
      if (changes.price !== undefined) item.price = changes.price;

      // Recalcul du total avec le nouveau prix
      state.totalAmount = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
    },
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, updateCartItemInfo } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalAmount;
export const selectCartCount = (state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer;
