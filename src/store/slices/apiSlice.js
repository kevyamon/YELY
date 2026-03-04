// src/store/slices/apiSlice.js
// COEUR RESEAU - Rotation Mutex & Anti-Sniffing & Persistance Robuste
// STANDARD: Industriel / Bank Grade

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import socketService from '../../services/socketService';
import SecureStorageAdapter from '../secureStoreAdapter';
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
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);

  // GESTION STRICTE DU 401 (Expire). Retrait du 403 pour eviter les boucles de deconnexion.
  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked() && !api.getState().auth.isRefreshing) {
      const release = await mutex.acquire();
      try {
        api.dispatch(setRefreshing(true));
        
        let currentRefreshToken = api.getState().auth.refreshToken;
        
        // CORRECTION MAJEURE : Prevention de la Race Condition au reveil de l'application
        // Si Redux a ete vide par l'OS, on cherche dans le stockage securise avant d'abandonner
        if (!currentRefreshToken) {
           currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
        }

        if (!currentRefreshToken) {
          console.warn('[AUTH] Aucun Refresh Token disponible meme apres verification du stockage, deconnexion forcee.');
          socketService.disconnect();
          api.dispatch(logout());
          return result;
        }

        console.info('[AUTH] Session expiree (15min). Tentative de rafraichissement silencieux...');

        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ refreshToken: currentRefreshToken })
        });

        const refreshData = await refreshResponse.json().catch(() => null);

        if (refreshResponse.ok && refreshData) {
          const payload = refreshData.data || refreshData;
          const newAccessToken = payload?.accessToken || payload?.token;
          const newRefreshToken = payload?.refreshToken || currentRefreshToken; 

          if (newAccessToken) {
            console.info('[AUTH] Rafraichissement reussi ! Reprise des requetes.');
            
            socketService.updateToken(newAccessToken);
            
            api.dispatch(setCredentials({ 
              accessToken: newAccessToken,
              refreshToken: newRefreshToken, 
              user: payload?.user || api.getState().auth.user 
            }));
            
            result = await baseQuery(args, api, extraOptions);
          } else {
            console.warn('[AUTH] Le serveur n\'a pas renvoye d\'Access Token valide. Deconnexion.');
            socketService.disconnect();
            api.dispatch(logout());
          }
        } else if (refreshResponse.status === 401) {
          console.warn(`[AUTH] Refresh Token definitivement rejete (Code ${refreshResponse.status}). Deconnexion.`);
          socketService.disconnect();
          api.dispatch(logout());
        } else {
          console.warn(`[AUTH] Erreur serveur ou reseau temporaire (Code ${refreshResponse.status}). La session est conservee intacte.`);
        }
      } catch (error) {
        console.error('[AUTH] Erreur reseau critique lors du rafraichissement. Session conservee.', error);
      } finally {
        api.dispatch(setRefreshing(false));
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Ride', 'Subscription', 'Transaction', 'Stats', 'MapSettings', 'Notification', 'AuditLog', 'Report', 'POI'],
  endpoints: () => ({}),
});