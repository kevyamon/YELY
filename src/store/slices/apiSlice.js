// src/store/slices/apiSlice.js
// PASSERELLE RESEAU - Auto-Retry & Anti-Deadlock integrés
// CSCSM Level: Bank Grade

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import * as Sentry from '@sentry/react-native';
import { Mutex } from 'async-mutex';
import socketService from '../../services/socketService';
import SecureStorageAdapter from '../secureStoreAdapter';
import { logout, setCredentials } from './authSlice';
import { showErrorToast } from './uiSlice';

const mutex = new Mutex();
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  timeout: 15000, 
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
  
  const tokenBeforeRequest = api.getState().auth.token;
  
  let requestUrl = '';
  if (typeof args === 'string') {
    requestUrl = args;
  } else if (args && args.url) {
    requestUrl = args.url;
  }
  
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && (result.error.status === 'FETCH_ERROR' || result.error.status === 'TIMEOUT_ERROR')) {
    console.warn(`[API] Micro-decrochage reseau sur ${requestUrl}. Auto-Retry silencieux dans 1.5s...`);
    await sleep(1500);
    result = await baseQuery(args, api, extraOptions);
  }

  if (result.error) {
    const errorStatus = result.error.status;
    const originalStatus = result.error.originalStatus;
    const actualStatus = errorStatus === 'PARSING_ERROR' ? originalStatus : errorStatus;
    
    const isSilent = (extraOptions && extraOptions.silent === true) || requestUrl.includes('submit');
    const isSystemRefreshing = mutex.isLocked() || api.getState().auth.isRefreshing;

    if (actualStatus !== 401 && actualStatus !== 400 && actualStatus !== 404 && actualStatus !== 409) {
      
      if (isSystemRefreshing && (errorStatus === 'FETCH_ERROR' || errorStatus === 'TIMEOUT_ERROR')) {
        console.info(`[API] Toast etouffe: Erreur transitoire (${errorStatus}) masquee pendant le refresh token.`);
      } else if (!isSilent) {
        let toastMessage = "Une erreur inattendue est survenue.";
        
        if (errorStatus === 'FETCH_ERROR') {
          toastMessage = "Impossible de joindre le serveur. Verifiez votre connexion.";
        } else if (actualStatus >= 500) {
          toastMessage = "Nos serveurs rencontrent un probleme technique. Nous y travaillons.";
        } else if (errorStatus === 'TIMEOUT_ERROR') {
          toastMessage = "La requete a pris trop de temps. Veuillez reessayer.";
        }

        api.dispatch(showErrorToast({
          title: "Probleme reseau",
          message: toastMessage
        }));

        if (!__DEV__) {
          Sentry.captureException(new Error(`API Error [${actualStatus}] on ${requestUrl}`), {
            extra: {
               status: actualStatus,
               url: requestUrl,
               response: result.error.data || result.error.error
            }
          });
        }
      }
    }
  }

  const errorStatus = result.error ? result.error.status : null;
  const originalStatus = result.error ? result.error.originalStatus : null;
  const actualStatus = errorStatus === 'PARSING_ERROR' ? originalStatus : errorStatus;

  if (result.error && actualStatus === 401) {
    if (!mutex.isLocked() && !api.getState().auth.isRefreshing) {
      const release = await mutex.acquire();
      try {
        const tokenAfterLock = api.getState().auth.token;
        
        if (tokenBeforeRequest !== tokenAfterLock) {
          console.info('[API] Race condition evitee: Token deja rafraichi. Rejeu.');
          return await baseQuery(args, api, extraOptions);
        }

        // CORRECTION : On ne dispatch plus setRefreshing(true) ici. 
        // Le mutex bloque les autres requêtes de façon invisible pour l'UX.
        // Cela empêche l'overlay "bête" d'apparaître sur de simples appels API.
        
        let currentRefreshToken = api.getState().auth.refreshToken;
        
        if (!currentRefreshToken) {
           currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
           
           if (!currentRefreshToken) {
             console.warn('[API] SecureStore potentiellement bloque. Nouvel essai...');
             await sleep(500);
             currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
           }
        }

        if (!currentRefreshToken) {
          console.warn('[AUTH FATAL] Aucun Refresh Token, deconnexion.');
          socketService.disconnect();
          api.dispatch(logout({ reason: 'MISSING_REFRESH_TOKEN_API_SLICE' }));
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
            socketService.updateToken(newAccessToken);
            
            api.dispatch(setCredentials({ 
              accessToken: newAccessToken,
              refreshToken: newRefreshToken, 
              user: payload?.user || api.getState().auth.user 
            }));
            
            result = await baseQuery(args, api, extraOptions);
          } else {
            socketService.disconnect();
            api.dispatch(logout({ reason: 'MALFORMED_REFRESH_PAYLOAD' }));
          }
        } else if (refreshResponse.status === 401) {
          socketService.disconnect();
          api.dispatch(logout({ reason: 'REFRESH_REJECTED_401' }));
        }
      } catch (error) {
        console.error('[API] Echec du fetch de rafraichissement. Session conservee.', error);
      } finally {
        // CORRECTION : On retire aussi le setRefreshing(false) ici.
        release();
      }
    } else {
      if (mutex.isLocked()) {
        await mutex.waitForUnlock();
      } else if (api.getState().auth.isRefreshing) {
        let loopCount = 0;
        while (api.getState().auth.isRefreshing && loopCount < 100) { 
          await sleep(100);
          loopCount++;
        }
        if (loopCount >= 100) {
          console.warn('[API] Force unlock declenche (Deadlock evite).');
        }
      }
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