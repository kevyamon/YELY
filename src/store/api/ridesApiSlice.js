import { apiSlice } from '../slices/apiSlice';

export const ridesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // --- NOUVEAUX ENDPOINTS PHASE 6 (Matchmaking & Négociation) ---
    requestRide: builder.mutation({
      query: (data) => ({
        url: '/api/rides/request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    lockRide: builder.mutation({
      query: (data) => ({
        url: '/api/rides/lock',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    submitPrice: builder.mutation({
      query: (data) => ({
        url: '/api/rides/propose',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    finalizeRide: builder.mutation({
      query: (data) => ({
        url: '/api/rides/finalize',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    startRide: builder.mutation({
      query: (data) => ({
        url: '/api/rides/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    completeRide: builder.mutation({
      query: (data) => ({
        url: '/api/rides/complete',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),

    // --- ANCIENS ENDPOINTS CONSERVÉS (Phase 5, Historique, etc.) ---
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
    estimateRide: builder.query({
      query: ({ pickupLat, pickupLng, dropoffLat, dropoffLng }) => 
        `/api/rides/estimate?pickupLat=${pickupLat}&pickupLng=${pickupLng}&dropoffLat=${dropoffLat}&dropoffLng=${dropoffLng}`,
    }),
  }),
  overrideExisting: true,
});

export const {
  useRequestRideMutation,
  useLockRideMutation,
  useSubmitPriceMutation,
  useFinalizeRideMutation,
  useStartRideMutation,
  useCompleteRideMutation,
  useCancelRideMutation,
  useRateRideMutation,
  useGetRideHistoryQuery,
  useGetCurrentRideQuery,
  useEstimateRideQuery,
  useLazyEstimateRideQuery,
} = ridesApiSlice;