import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// On récupère l'URL dynamiquement depuis le fichier .env
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    // Cette partie permettra de passer le Token automatiquement plus tard
    prepareHeaders: (headers, { getState }) => {
      // Logique pour le Token Bearer ici bientôt
      return headers;
    },
  }),
  tagTypes: ['User', 'Ride', 'Subscription'],
  endpoints: (builder) => ({}),
});