import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from './authSlice';
import SecureStorageAdapter from '../secureStoreAdapter';

// Mutex simple pour éviter refresh multiples
let isRefreshing = false;
let refreshPromise = null;

// On utilise process.env pour lire le fichier .env de manière moderne avec Expo
// On garde ton lien Render en secours si le .env n'est pas chargé
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://yely-backend-pu0n.onrender.com/api';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  // 🛡️ SÉCURITÉ : On retire credentials: 'include' car ton serveur Render utilise "*" 
  // pour le moment. On passera par les headers Authorization pour l'identité.
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Wrapper avec gestion de la réauthentification (401)
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // 1. Tenter la requête
  let result = await baseQuery(args, api, extraOptions);

  // 2. Si 401 (Non autorisé / Token expiré)
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
            const currentUser = api.getState().auth.userInfo;

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
          api.dispatch(logout());
          return false;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
    }

    await refreshPromise;

    // Réessayer la requête initiale
    result = await baseQuery(args, api, extraOptions);
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Ride', 'Notification', 'Subscription', 'Transaction', 'Stats'],
  endpoints: () => ({}),
});