// src/store/slices/authSlice.js
// GESTION SESSION - Sécurisation PII (SecureStore) & Déconnexion Intégrale
// CSCSM Level: Bank Grade

import { createSlice } from '@reduxjs/toolkit';
import socketService from '../../services/socketService';
import SecureStorageAdapter from '../secureStoreAdapter';

const initialState = {
  user: null,
  token: null,
  // 🛡️ SÉCURITÉ : Le refreshToken n'existe plus en clair côté client. Il est géré via Cookie réseau.
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      // Nettoyage de la destruction pour s'adapter au nouveau format de l'API
      const { user, accessToken, token } = action.payload || {};
      const finalToken = accessToken || token;

      if (!user || !finalToken) {
        console.warn('[Redux] Données de connexion incomplètes');
      }

      state.user = user || state.user;
      state.token = finalToken || state.token;
      state.isAuthenticated = true;

      // 🛡️ SÉCURITÉ : Persistance 100% SecureStore (Plus de PII en clair)
      if (state.user) SecureStorageAdapter.setItem('userInfo', JSON.stringify(state.user));
      if (state.token) SecureStorageAdapter.setItem('token', state.token);
    },
    
    updateUserInfo: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      SecureStorageAdapter.setItem('userInfo', JSON.stringify(state.user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // 🛡️ SÉCURITÉ : Nettoyage intégral
      SecureStorageAdapter.removeItem('userInfo');
      SecureStorageAdapter.removeItem('token');
      // Le navigateur ou le gestionnaire natif de requêtes nettoiera le cookie lui-même lors de l'appel API /logout.

      // 🔌 COUPURE WEBSOCKET : Empêche le token zombie d'émettre
      socketService.disconnect();
    },

    restoreAuth: (state, action) => {
      const { user, token } = action.payload || {};
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!(user && token);
    },
  },
});

export const { setCredentials, updateUserInfo, logout, restoreAuth } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectToken = (state) => state.auth.token;