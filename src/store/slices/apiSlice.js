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

  // GESTION DES ERREURS 401 (Expire) ET 403 (Forbidden - Changement de permissions)
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

        console.info('[AUTH] Session expiree ou permissions insuffisantes. Tentative de rafraichissement...');

        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ refreshToken: currentRefreshToken })
        });

        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok && refreshData.success) {
          const payload = refreshData.data;
          const newAccessToken = payload?.accessToken;
          const newRefreshToken = payload?.refreshToken; // <- On recupere le nouveau token recu en JSON

          if (newAccessToken && newRefreshToken) {
            console.info('[AUTH] Rafraichissement reussi. Mise a jour des tokens.');
            
            // On envoie les NOUVEAUX tokens au store (qui va ecraser les anciens dans SecureStore)
            api.dispatch(setCredentials({ 
              accessToken: newAccessToken,
              refreshToken: newRefreshToken, 
              user: payload?.user || api.getState().auth.user 
            }));
            
            // On rejoue la requete initiale qui avait echoue
            result = await baseQuery(args, api, extraOptions);
          } else {
            console.warn('[AUTH] Le serveur n\'a pas renvoye les tokens attendus.');
            api.dispatch(logout());
          }
        } else if (refreshResponse.status === 401 || refreshResponse.status === 400 || refreshResponse.status === 403) {
          console.warn('[AUTH] Refresh Token rejete par le serveur. Deconnexion.');
          api.dispatch(logout());
        }
      } catch (error) {
        console.error('[AUTH] Erreur reseau critique lors du rafraichissement:', error);
        // SECURITE : On ne deconnecte pas en cas de simple coupure internet
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
  // CORRECTION SENIOR: Ajout de 'AuditLog' dans les tagTypes globaux
  tagTypes: ['User', 'Ride', 'Subscription', 'Transaction', 'Stats', 'MapSettings', 'Notification', 'AuditLog'],
  endpoints: () => ({}),
});