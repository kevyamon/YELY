// src/store/store.js
// POINT DE VERITE REDUX - Configuration Industrielle (Purge Automatique incluse)

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './slices/apiSlice';
import authReducer from './slices/authSlice';
import rideReducer from './slices/rideSlice';
import uiReducer from './slices/uiSlice';

// 1. On regroupe tous les "morceaux" de l'application dans un seul objet
const appReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authReducer,
  ui: uiReducer,
  ride: rideReducer,
});

// 2. AJOUT SENIOR : Le super-gestionnaire (Root Reducer)
// Il écoute toutes les actions. S'il entend "logout", il détruit complètement 
// le cache (state = undefined) avant de redonner la main à l'application.
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    state = undefined; // BOUM ! Purge totale (API Cache + Redux State)
  }
  return appReducer(state, action);
};

// 3. On configure le magasin de données avec notre super-gestionnaire
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Necessaire pour certains payloads complexes (dates, etc)
    }).concat(apiSlice.middleware),
  devTools: __DEV__, // Active uniquement en mode developpement
});

export default store;