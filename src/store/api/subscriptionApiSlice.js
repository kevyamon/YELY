// src/store/api/subscriptionApiSlice.js
// CONNEXION API SOUSCRIPTION - RTK Query
// STANDARD: Industriel / Bank Grade

import { apiSlice } from '../slices/apiSlice';

export const subscriptionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // Recuperation des tarifs et des liens Wave (Inclut la logique Promo)
    getConfig: builder.query({
      query: () => '/subscriptions/config',
      providesTags: ['Subscription'],
    }),

    // Verification du statut d'abonnement (Actif, Expiré, ou En attente de validation)
    getSubscriptionStatus: builder.query({
      query: () => '/subscriptions/status',
      providesTags: ['Subscription'],
    }),

    // Soumission de la capture d'ecran (Multipart/FormData)
    submitProof: builder.mutation({
      query: (formData) => ({
        url: '/subscriptions/submit-proof',
        method: 'POST',
        body: formData,
        // Ne pas forcer le Content-Type ici, RTK Query et le navigateur 
        // genereront automatiquement le bon boundary pour le multipart/form-data
      }),
      invalidatesTags: ['Subscription'],
    }),
    
  }),
  overrideExisting: true, // Ecrase les anciennes definitions de l'IA precedente
});

export const {
  useGetConfigQuery,
  useGetSubscriptionStatusQuery,
  useSubmitProofMutation,
} = subscriptionApiSlice;