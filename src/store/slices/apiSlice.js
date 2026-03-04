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
  
  // Capture de l'etat du token AVANT la requete
  const tokenBeforeRequest = api.getState().auth.token;
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        // Capture de l'etat du token APRES l'obtention du verrou
        const tokenAfterLock = api.getState().auth.token;
        
        // CORRECTION MAJEURE : Prevention de la Race Condition
        // Si le token a change pendant l'attente du verrou, une autre requete a deja fait le job.
        if (tokenBeforeRequest !== tokenAfterLock) {
          console.info('[API] Race condition evitee: Token deja rafraichi par une requete parallele. Rejeu.');
          return await baseQuery(args, api, extraOptions);
        }

        api.dispatch(setRefreshing(true));
        console.info('[API] Verrou acquis. Demarrage du rafraichissement exclusif.');
        
        let currentRefreshToken = api.getState().auth.refreshToken;
        
        if (!currentRefreshToken) {
           currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
        }

        if (!currentRefreshToken) {
          console.warn('[AUTH FATAL] Aucun Refresh Token disponible, deconnexion forcee.');
          socketService.disconnect();
          api.dispatch(logout({ reason: 'REFRESH_TOKEN_MISSING_API_SLICE' }));
          return result;
        }

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
            console.info('[AUTH SUCCESS] Rafraichissement reussi. Mise a jour du store et rejeu.');
            socketService.updateToken(newAccessToken);
            
            api.dispatch(setCredentials({ 
              accessToken: newAccessToken,
              refreshToken: newRefreshToken, 
              user: payload?.user || api.getState().auth.user 
            }));
            
            result = await baseQuery(args, api, extraOptions);
          } else {
            console.warn('[AUTH FATAL] Payload invalide recu du serveur. Deconnexion.');
            socketService.disconnect();
            api.dispatch(logout({ reason: 'INVALID_PAYLOAD_ON_REFRESH' }));
          }
        } else if (refreshResponse.status === 401) {
          console.warn('[AUTH FATAL] Refresh Token rejete par le serveur (401). Deconnexion.');
          socketService.disconnect();
          api.dispatch(logout({ reason: 'REFRESH_TOKEN_REJECTED_401' }));
        } else {
          console.warn(`[API] Erreur temporaire (${refreshResponse.status}). Session conservee.`);
        }
      } catch (error) {
        console.error('[API FATAL] Echec reseau critique lors du rafraichissement:', error);
      } finally {
        api.dispatch(setRefreshing(false));
        console.info('[API] Verrou libere.');
        release();
      }
    } else {
      console.info('[API] Mutex verrouille. Mise en attente de la requete...');
      await mutex.waitForUnlock();
      console.info('[API] Mutex debloque. Rejeu de la requete mise en attente.');
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