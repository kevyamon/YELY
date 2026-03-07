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
      extraOptions: { silent: true }, 
      // SUPPRESSION DE L'INVALIDATION BRUTALE pour éviter la tempête réseau après upload
      // invalidatesTags: ['Subscription'], 
      
      // AJOUT : Mise à jour optimiste du cache (Optimistic Update)
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
          patchResult.undo(); // Annule la mise à jour si la requête échoue vraiment
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