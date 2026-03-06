// src/store/slices/apiSlice.js
// COEUR RESEAU - Rotation Mutex & Anti-Sniffing & Persistance Robuste & Sentry
// STANDARD: Industriel / Bank Grade

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import * as Sentry from '@sentry/react-native';
import { Mutex } from 'async-mutex';
import socketService from '../../services/socketService';
import SecureStorageAdapter from '../secureStoreAdapter';
import { logout, setCredentials, setRefreshing } from './authSlice';
import { showErrorToast } from './uiSlice';

const mutex = new Mutex();
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  
  const tokenBeforeRequest = api.getState().auth.token;
  let result = await baseQuery(args, api, extraOptions);

  // --- GESTION GLOBALE DES ERREURS API (SENTRY & TOASTS) ---
  if (result.error) {
    const errorStatus = result.error.status;
    const requestUrl = typeof args === 'string' ? args : args.url;
    
    // Le bouclier anti-condition de course : 
    // Si une rotation de token est en cours, les requetes concurrentes peuvent echouer brutalement.
    const isSystemRefreshing = mutex.isLocked() || api.getState().auth.isRefreshing;

    // Ignorer les erreurs 401 (elles sont gerees juste en bas par le mutex)
    // Ignorer les erreurs 400, 404, 409 (erreurs de validation gerees par les composants)
    if (errorStatus !== 401 && errorStatus !== 400 && errorStatus !== 404 && errorStatus !== 409) {
      
      // L'etouffoir : On masque les erreurs reseau transitoires si on est en plein rafraichissement
      if (isSystemRefreshing && (errorStatus === 'FETCH_ERROR' || errorStatus === 'TIMEOUT_ERROR')) {
        console.info(`[API] Toast etouffe: Erreur transitoire (${errorStatus}) masquee pendant le refresh token.`);
      } else {
        let toastMessage = "Une erreur inattendue est survenue.";
        
        if (errorStatus === 'FETCH_ERROR') {
          toastMessage = "Impossible de joindre le serveur. Verifiez votre connexion.";
        } else if (errorStatus >= 500) {
          toastMessage = "Nos serveurs rencontrent un probleme technique. Nous y travaillons.";
        } else if (errorStatus === 'TIMEOUT_ERROR') {
          toastMessage = "La requete a pris trop de temps.";
        }

        // Affichage du Toast a l'utilisateur
        api.dispatch(showErrorToast({
          title: "Probleme reseau",
          message: toastMessage
        }));

        // Envoi silencieux a Sentry (uniquement en prod, pour eviter le spam en dev)
        if (!__DEV__) {
          Sentry.captureException(new Error(`API Error [${errorStatus}] on ${requestUrl}`), {
            extra: {
               status: errorStatus,
               url: requestUrl,
               response: result.error.data || result.error.error
            }
          });
        }
      }
    }
  }
  // --------------------------------------------------------

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked() && !api.getState().auth.isRefreshing) {
      const release = await mutex.acquire();
      try {
        const tokenAfterLock = api.getState().auth.token;
        
        if (tokenBeforeRequest !== tokenAfterLock) {
          console.info('[API] Race condition evitee: Token deja rafraichi. Rejeu.');
          return await baseQuery(args, api, extraOptions);
        }

        api.dispatch(setRefreshing(true));
        
        let currentRefreshToken = api.getState().auth.refreshToken;
        
        if (!currentRefreshToken) {
           currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
           
           if (!currentRefreshToken) {
             console.warn('[API] SecureStore potentiellement bloque. Nouvel essai dans 500ms...');
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

        console.info('[API] Demarrage du rafraichissement exclusif.');

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
            console.info('[🟢 AUTH SUCCESS] Rafraichissement reussi.');
            socketService.updateToken(newAccessToken);
            
            api.dispatch(setCredentials({ 
              accessToken: newAccessToken,
              refreshToken: newRefreshToken, 
              user: payload?.user || api.getState().auth.user 
            }));
            
            result = await baseQuery(args, api, extraOptions);
          } else {
            console.warn('[🔴 AUTH FATAL] Access Token manquant dans la reponse.');
            socketService.disconnect();
            api.dispatch(logout({ reason: 'MALFORMED_REFRESH_PAYLOAD' }));
          }
        } else if (refreshResponse.status === 401) {
          console.warn('[🔴 AUTH FATAL] Refresh Token rejete par le backend (401).');
          socketService.disconnect();
          api.dispatch(logout({ reason: 'REFRESH_REJECTED_401' }));
        } else {
          console.warn(`[API] Erreur reseau ou serveur (${refreshResponse.status}). Session conservee intacte.`);
        }
      } catch (error) {
        console.error('[API] Echec du fetch de rafraichissement (Reseau coupe ?). Session conservee.', error);
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