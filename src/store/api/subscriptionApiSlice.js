// src/store/api/subscriptionApiSlice.js
// CONNEXION API SOUSCRIPTION - RTK Query
// STANDARD: Industriel / Bank Grade

import { apiSlice } from '../slices/apiSlice';

export const subscriptionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getConfig: builder.query({
      query: () => '/subscriptions/config',
      providesTags: ['Subscription'],
      // Nettoyage: retrait de keepUnusedDataFor pour laisser le cache RTK (60s) operer
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
      extraOptions: { silent: true }, 
      
      async onQueryStarted(formData, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          subscriptionApiSlice.util.updateQueryData('getSubscriptionStatus', undefined, (draft) => {
            if (draft && draft.data) {
              draft.data.isPending = true;
            } else {
              draft.data = { isPending: true, isActive: false };
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo(); 
        }
      }
    }),
    
  }),
  overrideExisting: true, 
});

export const {
  useGetConfigQuery,
  useGetSubscriptionStatusQuery,
  useSubmitProofMutation,
} = subscriptionApiSlice;