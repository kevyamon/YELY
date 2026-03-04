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

  // GESTION DES ERREURS 401 (Expire) ET 403 (Forbidden)
  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        api.dispatch(setRefreshing(true));
        
        const currentRefreshToken = api.getState().auth.refreshToken;
        
        if (!currentRefreshToken) {
          console.warn('[AUTH] Aucun Refresh Token disponible, deconnexion forcee.');
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

        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok) {
          // CORRECTION SENIOR : Extraction blindée (supporte { success: true, data: {...} } ou juste {...})
          const payload = refreshData.data || refreshData;
          const newAccessToken = payload?.accessToken || payload?.token;
          
          // CORRECTION SENIOR : Si le backend omet le refreshToken, on CONSERVE l'actuel pour ne pas casser la boucle
          const newRefreshToken = payload?.refreshToken || currentRefreshToken; 

          if (newAccessToken) {
            console.info('[AUTH] Rafraichissement reussi ! Reprise des requetes.');
            
            // On ecrase silencieusement dans Redux et le SecureStore
            api.dispatch(setCredentials({ 
              accessToken: newAccessToken,
              refreshToken: newRefreshToken, 
              user: payload?.user || api.getState().auth.user 
            }));
            
            // On rejoue la requete initiale qui avait echoue avec le nouveau token
            result = await baseQuery(args, api, extraOptions);
          } else {
            console.warn('[AUTH] Le serveur n\'a pas renvoye d\'Access Token.');
            api.dispatch(logout());
          }
        } else {
          console.warn(`[AUTH] Refresh Token rejete (Code ${refreshResponse.status}). Deconnexion.`);
          api.dispatch(logout());
        }
      } catch (error) {
        console.error('[AUTH] Erreur reseau critique lors du rafraichissement:', error);
        // SECURITE : On ne deconnecte PAS en cas de coupure internet pendant le refresh
      } finally {
        api.dispatch(setRefreshing(false));
        release();
      }
    } else {
      // Si le Mutex est dejà verrouillé par une autre requête, on attend patiemment puis on rejoue
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Ride', 'Subscription', 'Transaction', 'Stats', 'MapSettings', 'Notification', 'AuditLog', 'Report'],
  endpoints: () => ({}),
});