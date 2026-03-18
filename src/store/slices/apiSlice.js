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
        if (errorStatus === 'FETCH_ERROR') toastMessage = "Impossible de joindre le serveur. Verifiez votre connexion.";
        else if (actualStatus >= 500) toastMessage = "Nos serveurs rencontrent un probleme technique. Nous y travaillons.";
        else if (errorStatus === 'TIMEOUT_ERROR') toastMessage = "La requete a pris trop de temps. Veuillez reessayer.";

        api.dispatch(showErrorToast({ title: "Probleme reseau", message: toastMessage }));

        if (!__DEV__) {
          Sentry.captureException(new Error(`API Error [${actualStatus}] on ${requestUrl}`), {
            extra: { status: actualStatus, url: requestUrl, response: result.error.data || result.error.error }
          });
        }
      }
    }
  }

  const errorStatus = result.error ? result.error.status : null;
  const originalStatus = result.error ? result.error.originalStatus : null;
  const actualStatus = errorStatus === 'PARSING_ERROR' ? originalStatus : errorStatus;

  if (result.error && actualStatus === 401) {
    
    // 1. GESTION DE LA CONCURRENCE INTELLIGENTE (Fix du rejeu aveugle)
    if (mutex.isLocked() || api.getState().auth.isRefreshing) {
      if (mutex.isLocked()) {
        await mutex.waitForUnlock();
      } else {
        let loopCount = 0;
        while (api.getState().auth.isRefreshing && loopCount < 150) { 
          await sleep(100);
          loopCount++;
        }
      }

      // VÉRIFICATION POST-ATTENTE : L'autre processus a-t-il sauvé la session ?
      const tokenAfterWait = api.getState().auth.token;
      if (tokenBeforeRequest !== tokenAfterWait) {
        return await baseQuery(args, api, extraOptions); 
      }
      // Si on arrive ici, l'autre processus a échoué (réseau coupé). 
      // On ne rejoue PAS la requête, on laisse le code descendre pour prendre le Mutex.
    }

    // 2. PRISE DE CONTRÔLE ET RAFRAÎCHISSEMENT
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const tokenAfterLock = api.getState().auth.token;
        if (tokenBeforeRequest !== tokenAfterLock) {
          return await baseQuery(args, api, extraOptions);
        }

        let currentRefreshToken = api.getState().auth.refreshToken;
        if (!currentRefreshToken) {
           currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
           if (!currentRefreshToken) {
             await sleep(500);
             currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
           }
        }

        if (!currentRefreshToken) {
          socketService.disconnect();
          api.dispatch(logout({ reason: 'MISSING_REFRESH_TOKEN_API_SLICE' }));
          return result;
        }

        // PROTECTION ANTI-DEADLOCK : Timeout strict de 15s sur le fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
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
            
            // TOUT EST RÉPARÉ, ON REJOUE LA REQUÊTE
            result = await baseQuery(args, api, extraOptions);
          } else {
            socketService.disconnect();
            api.dispatch(logout({ reason: 'MALFORMED_REFRESH_PAYLOAD' }));
          }
        } else if (refreshResponse.status === 401 || refreshResponse.status === 403) {
          socketService.disconnect();
          api.dispatch(logout({ reason: 'REFRESH_REJECTED_401' }));
        }
      } catch (error) {
        console.error('[API] Echec du fetch de rafraichissement. Mutex libere.', error);
      } finally {
        release();
      }
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