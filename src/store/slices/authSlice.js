// src/store/slices/authSlice.js
// GESTION DE LA SESSION - Blindage contre les crashs

import { createSlice } from '@reduxjs/toolkit';
import SecureStorageAdapter from '../secureStoreAdapter';

const initialState = {
  userInfo: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload || {};

      // SÉCURITÉ : Refus de mettre à jour si les données critiques manquent
      if (!user || !accessToken) {
        console.warn('[Redux] Tentative de setCredentials avec des données incomplètes.');
        return;
      }

      state.userInfo = user;
      state.token = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;

      // Persistance sécurisée
      SecureStorageAdapter.setItem('userInfo', JSON.stringify(user));
      SecureStorageAdapter.setItem('token', accessToken);
      if (refreshToken) {
        SecureStorageAdapter.setItem('refreshToken', refreshToken);
      }
    },
    updateUserInfo: (state, action) => {
      if (!state.userInfo) return;
      state.userInfo = { ...state.userInfo, ...action.payload };
      SecureStorageAdapter.setItem('userInfo', JSON.stringify(state.userInfo));
    },
    logout: (state) => {
      state.userInfo = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      SecureStorageAdapter.removeItem('userInfo');
      SecureStorageAdapter.removeItem('token');
      SecureStorageAdapter.removeItem('refreshToken');
    },
    restoreAuth: (state, action) => {
      const { user, token, refreshToken } = action.payload || {};
      state.userInfo = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = !!(user && token);
    },
  },
});

export const { setCredentials, updateUserInfo, logout, restoreAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.userInfo;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.userInfo?.role;
export const selectToken = (state) => state.auth.token;