import { apiSlice } from '../slices/apiSlice';

export const ridesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // --- NOUVEAUX ENDPOINTS PHASE 6 (Matchmaking & Négociation) ---
    requestRide: builder.mutation({
      query: (data) => ({
        url: '/rides/request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    lockRide: builder.mutation({
      query: (data) => ({
        url: '/rides/lock',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    submitPrice: builder.mutation({
      query: (data) => ({
        url: '/rides/propose',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    finalizeRide: builder.mutation({
      query: (data) => ({
        url: '/rides/finalize',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    startRide: builder.mutation({
      query: (data) => ({
        url: '/rides/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),
    completeRide: builder.mutation({
      query: (data) => ({
        url: '/rides/complete',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Ride'],
    }),

    // --- ENDPOINT D'URGENCE (Nettoyage de la base de données) ---
    emergencyCancelRide: builder.mutation({
      query: () => ({
        url: '/rides/emergency-cancel',
        method: 'POST',
      }),
      invalidatesTags: ['Ride'],
    }),

    // --- ANCIENS ENDPOINTS CONSERVÉS (Phase 5, Historique, etc.) ---
    cancelRide: builder.mutation({
      query: ({ rideId, reason }) => ({
        url: `/rides/${rideId}/cancel`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: ['Ride'],
    }),
    rateRide: builder.mutation({
      query: ({ rideId, rating, comment }) => ({
        url: `/rides/${rideId}/rate`,
        method: 'PUT',
        body: { rating, comment },
      }),
    }),
    getRideHistory: builder.query({
      query: ({ page = 1, limit = 20 }) => `/rides/history?page=${page}&limit=${limit}`,
      providesTags: ['Ride'],
    }),
    getCurrentRide: builder.query({
      query: () => '/rides/current',
      providesTags: ['Ride'],
    }),
    estimateRide: builder.query({
      query: ({ pickupLat, pickupLng, dropoffLat, dropoffLng }) => 
        `/rides/estimate?pickupLat=${pickupLat}&pickupLng=${pickupLng}&dropoffLat=${dropoffLat}&dropoffLng=${dropoffLng}`,
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
  useEmergencyCancelRideMutation,
  useCancelRideMutation,
  useRateRideMutation,
  useGetRideHistoryQuery,
  useGetCurrentRideQuery,
  useEstimateRideQuery,
  useLazyEstimateRideQuery,
} = ridesApiSlice;