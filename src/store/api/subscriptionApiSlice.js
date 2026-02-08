// src/store/api/subscriptionApiSlice.js

import { apiSlice } from '../slices/apiSlice';

export const subscriptionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptionStatus: builder.query({
      query: () => '/api/subscription/status',
      providesTags: ['Subscription'],
    }),
    submitProof: builder.mutation({
      query: (formData) => ({
        url: '/api/subscription/submit-proof',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Subscription'],
    }),
    getPromoStatus: builder.query({
      query: () => '/api/subscription/promo-status',
    }),
  }),
});

export const {
  useGetSubscriptionStatusQuery,
  useSubmitProofMutation,
  useGetPromoStatusQuery,
} = subscriptionApiSlice;