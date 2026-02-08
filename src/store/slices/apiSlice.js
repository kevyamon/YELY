import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// On utilise process.env pour lire le fichier .env de manière moderne avec Expo
// On garde ton lien Render en secours si le .env n'est pas chargé
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://yely-backend-pu0n.onrender.com/api';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  // 🛡️ SÉCURITÉ : On retire credentials: 'include' car ton serveur Render utilise "*" 
  // pour le moment. On passera par les headers Authorization pour l'identité.
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Wrapper avec gestion de la réauthentification (401)
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Si le token est invalide, on déconnecte proprement
    api.dispatch({ type: 'auth/logout' });
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Ride', 'Notification', 'Subscription', 'Transaction', 'Stats'],
  endpoints: () => ({}),
});