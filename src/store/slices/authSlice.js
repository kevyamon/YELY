// src/store/slices/authSlice.js
// GESTION SESSION - SÉCURISATION PII & FONCTIONS PURES REDUX
// CSCSM Level: Bank Grade

import { createSlice } from '@reduxjs/toolkit';
import SecureStorageAdapter from '../secureStoreAdapter';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isRefreshing: false, 
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, token, refreshToken } = action.payload || {};
      const finalToken = accessToken || token;

      if (!user && !finalToken && !refreshToken) {
        console.warn('[Redux] Données de connexion incomplètes');
      }

      if (user) state.user = user;
      if (finalToken) state.token = finalToken;
      if (refreshToken) state.refreshToken = refreshToken;
      
      state.isAuthenticated = !!(state.user && state.token);

      if (state.user) SecureStorageAdapter.setItem('userInfo', JSON.stringify(state.user));
      if (state.token) SecureStorageAdapter.setItem('token', state.token);
      if (state.refreshToken) SecureStorageAdapter.setItem('refreshToken', state.refreshToken);
    },
    
    updateUserInfo: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      SecureStorageAdapter.setItem('userInfo', JSON.stringify(state.user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isRefreshing = false;
      
      SecureStorageAdapter.removeItem('userInfo');
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

    setRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
    }
  },
});

export const { setCredentials, updateUserInfo, logout, restoreAuth, setRefreshing } = authSlice.actions;

/**
 * Thunk pour forcer un rafraichissement silencieux du profil et du token.
 * Indispensable pour mettre a jour les permissions (ex: passage en mode Admin).
 */
export const forceSilentRefresh = () => async (dispatch, getState) => {
  const { auth } = getState();
  const currentRefreshToken = auth.refreshToken;

  if (!currentRefreshToken || auth.isRefreshing) return;

  try {
    dispatch(setRefreshing(true));
    const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      dispatch(setCredentials({
        user: result.data.user,
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken || currentRefreshToken
      }));
    }
  } catch (error) {
    console.error("[AUTH] Echec du rafraichissement force:", error);
  } finally {
    dispatch(setRefreshing(false));
  }
};

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectToken = (state) => state.auth.token;
export const selectIsRefreshing = (state) => state.auth.isRefreshing;