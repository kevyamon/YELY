// src/store/slices/authSlice.js
// GESTION SESSION - SECURISATION PII & FONCTIONS PURES REDUX
// STANDARD: Industriel / Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import socketService from '../../services/socketService';
import SecureStorageAdapter from '../secureStoreAdapter';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  tokenAcquiredAt: null, 
  isAuthenticated: false,
  isRefreshing: false, 
  subscriptionStatus: {
    isActive: false,
    isPending: false,
    isRejected: false,
    rejectionReason: null,
    expiresAt: null
  },
  promoMode: {
    isActive: false,
    message: ""
  },
  isSubscriptionModalDismissed: false
};

const safeStorageSet = (key, value) => {
  Promise.resolve(SecureStorageAdapter.setItem(key, value)).catch(err => {
    console.error(`[Redux] Echec de sauvegarde pour ${key}:`, err);
  });
};

const safeStorageRemove = (key) => {
  Promise.resolve(SecureStorageAdapter.removeItem(key)).catch(err => {
    console.error(`[Redux] Echec de suppression pour ${key}:`, err);
  });
};

const computeIsActive = (sub) => {
  if (!sub || typeof sub !== 'object') return false;
  if (sub.isActive) return true;
  if (sub.expiresAt) {
    return new Date(sub.expiresAt) > new Date();
  }
  return false;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, token, refreshToken } = action.payload || {};
      const finalToken = accessToken || token;

      if (!user && !finalToken && !refreshToken) {
        console.warn('[Redux] Donnees de connexion incompletes');
      }

      if (user) {
        state.user = user;
        if (user.subscription && typeof user.subscription === 'object') {
          state.subscriptionStatus = {
            ...state.subscriptionStatus,
            isActive: computeIsActive(user.subscription),
            isPending: user.subscription.isPending || false,
            expiresAt: user.subscription.expiresAt || null
          };
        }
      }

      if (finalToken) {
        state.token = finalToken;
        state.tokenAcquiredAt = Date.now(); 
        safeStorageSet('tokenAcquiredAt', String(state.tokenAcquiredAt));
      }
      
      if (refreshToken) state.refreshToken = refreshToken;
      
      state.isAuthenticated = !!state.token;

      if (state.user) safeStorageSet('userInfo', JSON.stringify(state.user));
      if (state.token) safeStorageSet('token', state.token);
      if (state.refreshToken) safeStorageSet('refreshToken', state.refreshToken);
    },
    
    updateUserInfo: (state, action) => {
      if (!state.user) return;
      state.user = { 
        ...state.user, 
        ...action.payload,
        subscription: action.payload.subscription !== undefined ? action.payload.subscription : state.user.subscription
      };

      if (action.payload.subscription) {
        state.subscriptionStatus = {
          ...state.subscriptionStatus,
          isActive: computeIsActive(action.payload.subscription),
          isPending: action.payload.subscription.isPending || false,
          isRejected: action.payload.subscription.isPending ? false : state.subscriptionStatus.isRejected,
          expiresAt: action.payload.subscription.expiresAt || null
        };
      }
      safeStorageSet('userInfo', JSON.stringify(state.user));
    },

    updateSubscriptionStatus: (state, action) => {
      const payload = action.payload || {};
      const isActive = payload.isActive !== undefined 
        ? payload.isActive 
        : (payload.expiresAt ? new Date(payload.expiresAt) > new Date() : state.subscriptionStatus.isActive);

      state.subscriptionStatus = { 
        ...state.subscriptionStatus, 
        ...payload,
        isActive
      };
    },

    updatePromoMode: (state, action) => {
      state.promoMode = {
        isActive: action.payload.isGlobalFreeAccess || false,
        message: action.payload.promoMessage || "Yely Regal ! Mode VIP Active."
      };
    },

    setSubscriptionModalDismissed: (state, action) => {
      state.isSubscriptionModalDismissed = action.payload;
    },

    logout: (state, action) => {
      const reason = action.payload?.reason || 'USER_INITIATED';
      console.warn(`[AUTH] Deconnexion declenchee. Raison: ${reason}`);

      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tokenAcquiredAt = null; 
      state.isAuthenticated = false;
      state.isRefreshing = false;
      state.subscriptionStatus = { isActive: false, isPending: false, isRejected: false, rejectionReason: null, expiresAt: null };
      state.isSubscriptionModalDismissed = false;
      
      safeStorageRemove('userInfo');
      safeStorageRemove('token');
      safeStorageRemove('refreshToken');
      safeStorageRemove('tokenAcquiredAt');
    },

    restoreAuth: (state, action) => {
      const { user, token, refreshToken, tokenAcquiredAt } = action.payload || {};
      state.user = user || null;
      state.token = token;
      state.refreshToken = refreshToken;
      
      state.tokenAcquiredAt = tokenAcquiredAt ? Number(tokenAcquiredAt) : 0; 
      state.isAuthenticated = !!token;
      state.isSubscriptionModalDismissed = false;
      
      if (user && user.subscription && typeof user.subscription === 'object') {
        state.subscriptionStatus = {
          ...state.subscriptionStatus,
          isActive: computeIsActive(user.subscription),
          isPending: user.subscription.isPending || false,
          expiresAt: user.subscription.expiresAt || null
        };
      }
    },

    setRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
    }
  },
});

export const { 
  setCredentials, 
  updateUserInfo, 
  updateSubscriptionStatus,
  updatePromoMode,
  logout, 
  restoreAuth, 
  setRefreshing,
  setSubscriptionModalDismissed 
} = authSlice.actions;

export const fetchPromoConfig = () => async (dispatch, getState) => {
  const { auth } = getState();
  if (!auth.token) return null;

  try {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
    const response = await fetch(`${API_URL}/subscriptions/config`, {
      headers: { 'Authorization': `Bearer ${auth.token}`, 'Accept': 'application/json' }
    });

    const result = await response.json();
    if (response.ok && result?.data) {
      dispatch(updatePromoMode({
        isGlobalFreeAccess: result.data.isGlobalFreeAccess,
        promoMessage: result.data.promoMessage
      }));
      return result.data; 
    }
  } catch (error) {
    console.warn("[AUTH] Impossible de synchroniser la config VIP au demarrage/login");
  }
  return null;
};

let isSilentRefreshing = false;

export const forceSilentRefresh = () => async (dispatch, getState) => {
  const { auth } = getState();
  if (!auth.refreshToken || isSilentRefreshing) return;

  isSilentRefreshing = true;
  try {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ refreshToken: auth.refreshToken, clientPlatform: Platform.OS })
    });

    const result = await response.json();
    if (response.ok && result?.data) {
      const payload = result.data;
      dispatch(setCredentials({
        user: payload.user,
        accessToken: payload.accessToken || payload.token,
        refreshToken: payload.refreshToken || auth.refreshToken
      }));
    }
  } catch (err) {
    console.warn("[AUTH] Rafraichissement silencieux ignore");
  } finally {
    isSilentRefreshing = false;
  }
};

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;
export const selectCurrentToken = (state) => state.auth.token;
export const selectSubscriptionStatus = (state) => state.auth.subscriptionStatus;
export const selectPromoMode = (state) => state.auth.promoMode;
export const selectIsSubscriptionModalDismissed = (state) => state.auth.isSubscriptionModalDismissed;

export default authSlice.reducer;