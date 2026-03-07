// src/store/api/subscriptionApiSlice.js
// CONNEXION API SOUSCRIPTION - RTK Query
// STANDARD: Industriel / Bank Grade

import { apiSlice } from '../slices/apiSlice';

export const subscriptionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getConfig: builder.query({
      query: () => '/subscriptions/config',
      providesTags: ['Subscription'],
      keepUnusedDataFor: 0, 
    }),

    getSubscriptionStatus: builder.query({
      query: () => '/subscriptions/status',
      providesTags: ['Subscription'],
    }),

    submitProof: builder.mutation({
      query: (formData) => ({
        url: '/subscriptions/submit-proof',
        method: 'POST',
        body: formData,
      }),
      extraOptions: { silent: true }, // AJOUT: On rend l'upload silencieux pour le gestionnaire global
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