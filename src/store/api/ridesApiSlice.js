// src/store/api/ridesApiSlice.js

import { apiSlice } from '../slices/apiSlice';

export const ridesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createRide: builder.mutation({
      query: (data) => ({
        url: '/api/rides',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    acceptRide: builder.mutation({
      query: ({ rideId }) => ({
        url: `/api/rides/${rideId}/accept`,
        method: 'PUT',
      }),
      invalidatesTags: ['Ride'],
    }),
    rejectRide: builder.mutation({
      query: ({ rideId, reason }) => ({
        url: `/api/rides/${rideId}/reject`,
        method: 'PUT',
        body: { reason },
      }),
    }),
    startRide: builder.mutation({
      query: ({ rideId }) => ({
        url: `/api/rides/${rideId}/start`,
        method: 'PUT',
      }),
      invalidatesTags: ['Ride'],
    }),
    completeRide: builder.mutation({
      query: ({ rideId }) => ({
        url: `/api/rides/${rideId}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: ['Ride'],
    }),
    cancelRide: builder.mutation({
      query: ({ rideId, reason }) => ({
        url: `/api/rides/${rideId}/cancel`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: ['Ride'],
    }),
    rateRide: builder.mutation({
      query: ({ rideId, rating, comment }) => ({
        url: `/api/rides/${rideId}/rate`,
        method: 'PUT',
        body: { rating, comment },
      }),
    }),
    getRideHistory: builder.query({
      query: ({ page = 1, limit = 20 }) => `/api/rides/history?page=${page}&limit=${limit}`,
      providesTags: ['Ride'],
    }),
    getCurrentRide: builder.query({
      query: () => '/api/rides/current',
      providesTags: ['Ride'],
    }),
    // 🏗️ PHASE 5 : NOUVEAU ENDPOINT POUR L'ESTIMATION
    estimateRide: builder.query({
      query: ({ pickupLat, pickupLng, dropoffLat, dropoffLng }) => 
        `/api/rides/estimate?pickupLat=${pickupLat}&pickupLng=${pickupLng}&dropoffLat=${dropoffLat}&dropoffLng=${dropoffLng}`,
    }),
  }),
  // CORRECTION : Autorise le rechargement à chaud (Hot Reload) sans erreur de duplication
  overrideExisting: true,
});

export const {
  useCreateRideMutation,
  useAcceptRideMutation,
  useRejectRideMutation,
  useStartRideMutation,
  useCompleteRideMutation,
  useCancelRideMutation,
  useRateRideMutation,
  useGetRideHistoryQuery,
  useGetCurrentRideQuery,
  useEstimateRideQuery,
  useLazyEstimateRideQuery,
} = ridesApiSlice;