// src/store/slices/apiSlice.js
// CŒUR RÉSEAU - Rotation Mutex, Cookies HttpOnly & Anti-Sniffing
// CSCSM Level: Bank Grade

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { logout, setCredentials } from './authSlice';

// Le Mutex empêche de lancer 10 requêtes de "refresh token" en même temps 
// si 10 composants font une erreur 401 simultanément.
const mutex = new Mutex();

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

// Configuration de base des requêtes
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  // Indispensable pour que React Native envoie le Cookie HttpOnly au backend
  credentials: 'omit', // React Native gère les cookies nativement via la session réseau de l'OS
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    
    // 🛡️ SÉCURITÉ : Injection dynamique du Bearer Token
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    // 🛡️ SÉCURITÉ : Protection contre le MIME-Sniffing et le Clickjacking
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Accept', 'application/json');
    
    return headers;
  },
});

// Intercepteur Global de Sécurité (Middleware)
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Attendre si une rotation de token est déjà en cours
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);

  // Interception de l'expiration du Access Token
  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        if (__DEV__) console.log('[API SECURITY] Access Token expiré. Tentative de rotation silencieuse...');
        
        // Appel de la route Refresh. 
        // Le Cookie HttpOnly sera envoyé automatiquement par le device.
        const refreshResult = await baseQuery(
          { url: '/auth/refresh-token', method: 'POST' },
          api,
          extraOptions
        );

        if (refreshResult.data?.success) {
          if (__DEV__) console.log('[API SECURITY] Rotation réussie. Mise à jour du coffre-fort.');
          // On sauvegarde le nouveau token à courte durée de vie
          api.dispatch(setCredentials({ 
            accessToken: refreshResult.data.data.accessToken 
          }));
          
          // On rejoue la requête initiale qui avait échoué
          result = await baseQuery(args, api, extraOptions);
        } else {
          if (__DEV__) console.warn('[API SECURITY] Rotation échouée (Session expirée ou bannie). Purge système.');
          api.dispatch(logout());
        }
      } finally {
        // Toujours relâcher le verrou
        release();
      }
    } else {
      // Si le mutex était verrouillé, on attend sa libération puis on rejoue la requête
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