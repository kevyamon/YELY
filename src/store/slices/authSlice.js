// src/store/slices/authSlice.js
// GESTION SESSION - Standardisé & Compatible removeItem

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice } from '@reduxjs/toolkit';
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

      // Persistance
      if (user) AsyncStorage.setItem('userInfo', JSON.stringify(user));
      if (finalToken) SecureStorageAdapter.setItem('token', finalToken);
      if (refreshToken) SecureStorageAdapter.setItem('refreshToken', refreshToken);
    },
    
    updateUserInfo: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      AsyncStorage.setItem('userInfo', JSON.stringify(state.user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      
      // Nettoyage (CORRIGÉ: removeItem au lieu de deleteItem)
      AsyncStorage.removeItem('userInfo');
      SecureStorageAdapter.removeItem('token');
      SecureStorageAdapter.removeItem('refreshToken');
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