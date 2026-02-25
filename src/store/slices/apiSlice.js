// src/store/slices/apiSlice.js
// CŒUR RÉSEAU - Rotation Mutex & Anti-Sniffing
// CSCSM Level: Bank Grade

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { logout, setCredentials, setRefreshing } from './authSlice';

const mutex = new Mutex();
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Accept', 'application/json');
    
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // On attend que le verrou soit levé avant de lancer une requête
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);

  // Si le token est expiré (Erreur 401)
  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        api.dispatch(setRefreshing(true));
        
        const refreshToken = api.getState().auth.refreshToken;
        
        if (!refreshToken) {
          api.dispatch(logout());
          return result;
        }

        // On part chercher un nouveau token (Correction de l'URL)
        const refreshResult = await baseQuery(
          { 
            url: '/auth/refresh', 
            method: 'POST',
            body: { refreshToken }
          },
          api,
          extraOptions
        );

        if (refreshResult.data && refreshResult.data.success) {
          api.dispatch(setCredentials({ 
            accessToken: refreshResult.data.data.accessToken,
            refreshToken: refreshResult.data.data.refreshToken || refreshToken
          }));
          
          // Magie : On relance la requête initiale qui avait échoué
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Si le refresh token est lui-même expiré ou invalide
          api.dispatch(logout());
        }
      } finally {
        api.dispatch(setRefreshing(false));
        release();
      }
    } else {
      // Si un autre appel est déjà en train de rafraîchir, on attend, puis on relance
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Ride', 'Subscription'],
  endpoints: () => ({}),
});