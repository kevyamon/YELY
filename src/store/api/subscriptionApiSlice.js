// src/store/api/subscriptionApiSlice.js
// CONNEXION API SOUSCRIPTION - RTK Query (Passerelle Automatisée GeniusPay)
// STANDARD: Industriel / Bank Grade

import { apiSlice } from '../slices/apiSlice';

export const subscriptionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getConfig: builder.query({
      query: () => '/subscriptions/config',
      providesTags: ['Subscription'],
    }),

    getSubscriptionStatus: builder.query({
      query: () => '/subscriptions/status',
      providesTags: ['Subscription'],
    }),

    initializePayment: builder.mutation({
      query: (body) => ({
        url: '/subscriptions/initialize',
        method: 'POST',
        body,
      }),
    }),

    verifyPayment: builder.query({
      query: (reference) => `/subscriptions/verify/${reference}`,
      providesTags: ['Subscription'],
    }),
    
  }),
  overrideExisting: true, 
});

export const {
  useGetConfigQuery,
  useGetSubscriptionStatusQuery,
  useInitializePaymentMutation,
  useLazyVerifyPaymentQuery,
} = subscriptionApiSlice;