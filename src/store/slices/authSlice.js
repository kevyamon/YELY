// src/store/slices/authSlice.js
// GESTION SESSION - SECURISATION PII & FONCTIONS PURES REDUX
// CSCSM Level: Bank Grade

import { createSlice } from '@reduxjs/toolkit';
import socketService from '../../services/socketService';
import SecureStorageAdapter from '../secureStoreAdapter';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isRefreshing: false, 
  subscriptionStatus: {
    isActive: false,
    isPending: false,
    expiresAt: null
  },
  // 🔥 NOUVEAU : Etat global du Mode Promo/Gratuit
  promoMode: {
    isActive: false,
    message: ""
  }
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, token, refreshToken } = action.payload || {};
      const finalToken = accessToken || token;

      if (user) {
        state.user = user;
        if (user.subscription && typeof user.subscription === 'object') {
          state.subscriptionStatus = {
            isActive: user.subscription.isActive || false,
            isPending: user.subscription.isPending || false,
            expiresAt: user.subscription.expiresAt || null
          };
        }
      }

      if (finalToken) state.token = finalToken;
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
          isActive: action.payload.subscription.isActive || false,
          isPending: action.payload.subscription.isPending || false,
          expiresAt: action.payload.subscription.expiresAt || null
        };
      }
      safeStorageSet('userInfo', JSON.stringify(state.user));
    },

    updateSubscriptionStatus: (state, action) => {
      state.subscriptionStatus = { ...state.subscriptionStatus, ...action.payload };
    },

    // 🔥 NOUVEAU : Action pour mettre a jour le mode Promo depuis les Sockets
    updatePromoMode: (state, action) => {
      state.promoMode = {
        isActive: action.payload.isGlobalFreeAccess || false,
        message: action.payload.promoMessage || "🎉 Mode VIP Activé !"
      };
    },

    logout: (state, action) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isRefreshing = false;
      state.subscriptionStatus = { isActive: false, isPending: false, expiresAt: null };
      // Note: On ne reinitialise pas le promoMode car il est global a l'app
      
      safeStorageRemove('userInfo');
      safeStorageRemove('token');
      safeStorageRemove('refreshToken');
    },

    restoreAuth: (state, action) => {
      const { user, token, refreshToken } = action.payload || {};
      state.user = user || null;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = !!token;
      
      if (user && user.subscription && typeof user.subscription === 'object') {
        state.subscriptionStatus = {
          isActive: user.subscription.isActive || false,
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
  updatePromoMode, // 🔥 Expose l'action
  logout, 
  restoreAuth, 
  setRefreshing 
} = authSlice.actions;

export const forceSilentRefresh = () => async (dispatch, getState) => {
  const { auth } = getState();
  let currentRefreshToken = auth.refreshToken;
  if (!currentRefreshToken) currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
  if (!currentRefreshToken || auth.isRefreshing) return;

  try {
    dispatch(setRefreshing(true));
    const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken })
    });

    const result = await response.json().catch(() => null);

    if (response.ok && result?.success) {
      const payload = result.data || result;
      const newAccessToken = payload.accessToken || payload.token;
      
      // 🔥 REQUETE SILENCIEUSE : On recupere l'etat du mode promo au demarrage
      try {
        const configResponse = await fetch(`${API_URL}/subscription/config`, {
          headers: { 'Authorization': `Bearer ${newAccessToken}` }
        });
        const configData = await configResponse.json();
        if (configData?.data) {
          dispatch(updatePromoMode({
            isGlobalFreeAccess: configData.data.isGlobalFreeAccess,
            promoMessage: configData.data.promoMessage
          }));
        }
      } catch (e) { console.warn("Impossible de fetch la config promo au refresh"); }

      if (newAccessToken) {
        socketService.updateToken(newAccessToken);
        dispatch(setCredentials({
          user: payload.user || auth.user,
          accessToken: newAccessToken,
          refreshToken: payload.refreshToken || currentRefreshToken
        }));
      }
    } else if (response.status === 401) {
      socketService.disconnect();
      dispatch(logout({ reason: 'WAKEUP_REFRESH_REJECTED' }));
    }
  } catch (error) {
    console.error("[AUTH] Echec reseau du rafraichissement force. Session conservee.");
  } finally {
    dispatch(setRefreshing(false));
  }
};

export default authSlice.reducer;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectToken = (state) => state.auth.token;
export const selectSubscriptionStatus = (state) => state.auth.subscriptionStatus;
export const selectPromoMode = (state) => state.auth.promoMode; // 🔥 Selecteur pour le UI