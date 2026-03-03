// src/store/store.js
// POINT DE VERITE REDUX - Configuration Industrielle

import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './slices/apiSlice';
import authReducer from './slices/authSlice';
import rideReducer from './slices/rideSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    ui: uiReducer,
    ride: rideReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Necessaire pour certains payloads complexes (dates, etc)
    }).concat(apiSlice.middleware),
  devTools: __DEV__, // Active uniquement en mode developpement
});

export default store;