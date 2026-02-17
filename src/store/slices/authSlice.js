// src/store/slices/authSlice.js
// GESTION SESSION - Sécurisation PII (SecureStore) & Déconnexion Intégrale
// CSCSM Level: Bank Grade

import { createSlice } from '@reduxjs/toolkit';
import socketService from '../../services/socketService'; // 🔌 IMPORT SOCKET
import SecureStorageAdapter from '../secureStoreAdapter';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, token, refreshToken } = action.payload || {};
      const finalToken = accessToken || token;

      if (!user || !finalToken) {
        console.warn('[Redux] Données de connexion incomplètes');
      }

      state.user = user || state.user;
      state.token = finalToken || state.token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.isAuthenticated = true;

      // 🛡️ SÉCURITÉ : Persistance 100% SecureStore (Plus de PII en clair)
      if (state.user) SecureStorageAdapter.setItem('userInfo', JSON.stringify(state.user));
      if (state.token) SecureStorageAdapter.setItem('token', state.token);
      if (state.refreshToken) SecureStorageAdapter.setItem('refreshToken', state.refreshToken);
    },
    
    updateUserInfo: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      
      // 🛡️ SÉCURITÉ : Mise à jour dans le coffre-fort
      SecureStorageAdapter.setItem('userInfo', JSON.stringify(state.user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      
      // 🛡️ SÉCURITÉ : Nettoyage intégral
      SecureStorageAdapter.removeItem('userInfo');
      SecureStorageAdapter.removeItem('token');
      SecureStorageAdapter.removeItem('refreshToken');

      // 🔌 COUPURE WEBSOCKET : Empêche le token zombie d'émettre
      socketService.disconnect();
    },

    restoreAuth: (state, action) => {
      const { user, token, refreshToken } = action.payload || {};
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = !!(user && token);
    },
  },
});

export const { setCredentials, updateUserInfo, logout, restoreAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectToken = (state) => state.auth.token;