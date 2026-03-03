// src/store/slices/apiSlice.js
// COEUR RESEAU - Rotation Mutex & Anti-Sniffing
// STANDARD: Industriel / Bank Grade

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { logout, setCredentials, setRefreshing } from './authSlice';

const mutex = new Mutex();
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    
    // N'injecte le token que s'il existe (et s'il n'est pas pour la route refresh, gere plus bas)
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Accept', 'application/json');
    
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        api.dispatch(setRefreshing(true));
        
        const refreshToken = api.getState().auth.refreshToken;
        
        if (!refreshToken) {
          console.warn('[AUTH] Aucun Refresh Token disponible, deconnexion forcee.');
          api.dispatch(logout());
          return result;
        }

        console.info('[AUTH] Access Token expire. Tentative de rafraichissement silencieux...');

        // CRITIQUE : Appel direct sans passer par baseQuery pour eviter l'injection du token expire
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            // AUCUN HEADER AUTHORIZATION ICI
          },
          body: JSON.stringify({ refreshToken })
        });

        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok) {
          const newAccessToken = refreshData?.data?.accessToken || refreshData?.accessToken;
          const newRefreshToken = refreshData?.data?.refreshToken || refreshData?.refreshToken || refreshToken;

          if (newAccessToken) {
            console.info('[AUTH] Rafraichissement reussi. Mise a jour du store et rejeu de la requete.');
            api.dispatch(setCredentials({ 
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
              // On conserve l'utilisateur existant
              user: api.getState().auth.user 
            }));
            
            // Rejeu de la requete initiale qui avait echoue
            result = await baseQuery(args, api, extraOptions);
          } else {
            console.error('[AUTH] Reponse refresh valide mais accessToken manquant dans le payload.');
            api.dispatch(logout());
          }
        } else {
          console.error(`[AUTH] Echec du rafraichissement (${refreshResponse.status}):`, refreshData);
          // Le Refresh Token lui-meme est expire ou invalide
          api.dispatch(logout());
        }
      } catch (error) {
        console.error('[AUTH] Erreur reseau critique lors du rafraichissement:', error);
        // Ne pas deconecter l'utilisateur s'il s'agit juste d'une coupure Internet (fetch failed)
        if (error.message !== 'Network request failed') {
           api.dispatch(logout());
        }
      } finally {
        api.dispatch(setRefreshing(false));
        release();
      }
    } else {
      // Les requetes concurrentes attendent que le mutex se libere, puis se rejouent
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // DECLARATION EXHAUSTIVE DE TOUS LES TAGS DU SYSTEME
  tagTypes: ['User', 'Ride', 'Subscription', 'Transaction', 'Stats', 'MapSettings', 'Notification'],
  endpoints: () => ({}),
});