// src/store/slices/apiSlice.js
// API GATEWAY - Gestion Centralisée, Reconnexion Auto & Hard Logout
// CSCSM Level: Bank Grade

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import socketService from '../../services/socketService';
import SecureStorageAdapter from '../secureStoreAdapter';
import { logout, setCredentials } from './authSlice';

// Mutex pour éviter que 10 requêtes tentent de refresh le token en même temps
let isRefreshing = false;
let refreshPromise = null;

// 🛡️ SÉCURITÉ : Plus de lien en dur
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  console.error("🚨 ERREUR CRITIQUE : EXPO_PUBLIC_API_URL est introuvable. Vérifiez votre fichier .env !");
}

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Interception 401 (Token expiré)
  if (result?.error?.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;

      refreshPromise = (async () => {
        try {
          const refreshToken = await SecureStorageAdapter.getItem('refreshToken');
          if (!refreshToken) throw new Error('No refresh token');

          const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const data = await refreshResponse.json();

          if (refreshResponse.ok && data.success) {
            // 🐛 FIX: user au lieu de userInfo
            const currentUser = api.getState().auth.user; 
            
            api.dispatch(setCredentials({
              user: currentUser,
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken || refreshToken
            }));
            return true;
          } else {
            throw new Error('Refresh failed');
          }
        } catch (e) {
          // 🛡️ SÉCURITÉ ABSOLUE : Coupure WebSocket avant le Logout API
          socketService.disconnect();
          api.dispatch(logout());
          return false;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
    }

    const success = await refreshPromise;
    if (success) {
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Ride', 'Notification', 'Subscription', 'Transaction', 'Stats'],
  endpoints: () => ({}),
});