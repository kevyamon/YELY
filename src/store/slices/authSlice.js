// src/store/slices/authSlice.js
// GESTION SESSION - SÉCURISATION PII & FONCTIONS PURES REDUX
// CSCSM Level: Bank Grade

import { createSlice } from '@reduxjs/toolkit';
import SecureStorageAdapter from '../secureStoreAdapter';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, token } = action.payload || {};
      const finalToken = accessToken || token;

      if (!user || !finalToken) {
        console.warn('[Redux] Données de connexion incomplètes');
      }

      state.user = user || state.user;
      state.token = finalToken || state.token;
      state.isAuthenticated = true;

      // 🛡️ SÉCURITÉ : Persistance 100% SecureStore
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
      
      // 🛡️ SÉCURITÉ : Nettoyage intégral. 
      // Note: Le socket sera déconnecté réactivement par le Hook useSocket !
      SecureStorageAdapter.removeItem('userInfo');
      SecureStorageAdapter.removeItem('token');
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