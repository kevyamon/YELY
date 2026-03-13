// src/store/store.js
// POINT DE VERITE REDUX - Configuration Industrielle (Purge Automatique incluse)
// CSCSM Level: Bank Grade

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './slices/apiSlice';
import authReducer from './slices/authSlice';
import rideReducer from './slices/rideSlice';
import uiReducer from './slices/uiSlice';

const appReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authReducer,
  ui: uiReducer,
  ride: rideReducer,
});

// Le super-gestionnaire (Root Reducer)
// Intercepte la deconnexion et purge tout l'etat en memoire pour eviter les crashs "fantomes".
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    state = undefined; 
  }
  return appReducer(state, action);
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware),
  devTools: __DEV__,
});

export default store;