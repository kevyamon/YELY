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
      // AJOUT SENIOR: On interdit la mise en cache prolongée pour les données financières (Prix et Promo)
      keepUnusedDataFor: 0, 
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
      }),
      invalidatesTags: ['Subscription'],
    }),
    
  }),
  overrideExisting: true, 
});

export const {
  useGetConfigQuery,
  useGetSubscriptionStatusQuery,
  useSubmitProofMutation,
} = subscriptionApiSlice;