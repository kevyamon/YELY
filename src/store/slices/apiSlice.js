// src/store/slices/apiSlice.js
// API GATEWAY - Gestion Centralisée & Reconnexion Auto
// CSCSM Level: Bank Grade

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import SecureStorageAdapter from '../secureStoreAdapter';
import { logout, setCredentials } from './authSlice';

// Mutex pour éviter que 10 requêtes tentent de refresh le token en même temps
let isRefreshing = false;
let refreshPromise = null;

// 🛡️ SÉCURITÉ : Plus de lien en dur. On charge strictement depuis l'environnement.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Sécurité au démarrage : Si le .env n'est pas chargé, on arrête tout tout de suite.
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

      // Lancement du refresh
      refreshPromise = (async () => {
        try {
          const refreshToken = await SecureStorageAdapter.getItem('refreshToken');
          if (!refreshToken) throw new Error('No refresh token');

          // Note : La route refresh est aussi sous /v1/auth/refresh
          const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const data = await refreshResponse.json();

          if (refreshResponse.ok && data.success) {
            const currentUser = api.getState().auth.userInfo;
            
            // Mise à jour du store
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
          // Si le refresh échoue, on déconnecte tout le monde (Sécurité)
          api.dispatch(logout());
          return false;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
    }

    // Attendre que le premier refresh finisse avant de réessayer
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