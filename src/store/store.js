// src/store/store.js
// POINT DE VERITE REDUX - Configuration Industrielle (Purge Automatique incluse)
// CSCSM Level: Bank Grade

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import SecureStorageAdapter from './secureStoreAdapter';
import { apiSlice } from './slices/apiSlice';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import rideReducer from './slices/rideSlice';
import uiReducer from './slices/uiSlice';
import locationReducer from './slices/locationSlice';

const appReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authReducer,
  ui: uiReducer,
  ride: rideReducer,
  cart: cartReducer,
  location: locationReducer,
});

// Le super-gestionnaire (Root Reducer)
// Intercepte la deconnexion et purge tout l'etat en memoire pour eviter les crashs "fantomes".
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    state = undefined; 
  }
  return appReducer(state, action);
};

const cartPersistenceMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  if (action.type.startsWith('cart/')) {
    try {
      const cartItems = store.getState().cart.items;
      SecureStorageAdapter.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      // Ignorer les erreurs d'ecriture pour eviter les crashs
    }
  }
  return result;
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware, cartPersistenceMiddleware),
  devTools: __DEV__,
});

export default store;