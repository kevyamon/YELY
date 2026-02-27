// src/store/api/ridesApiSlice.js
// GESTIONNAIRE D'API RIDES - Optimistic Updates (Zero Latency UI)
// CSCSM Level: Bank Grade

import { apiSlice } from '../slices/apiSlice';

export const ridesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
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
      // ⚡ OPTIMISTIC UPDATE : Mise à jour instantanée de l'interface avant la réponse serveur
      async onQueryStarted({ rideId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          ridesApiSlice.util.updateQueryData('getCurrentRide', undefined, (draft) => {
            if (draft && (draft._id === rideId || draft.id === rideId || draft.rideId === rideId)) {
              draft.status = 'ongoing';
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo(); // Rollback automatique en cas d'erreur réseau
        }
      },
      invalidatesTags: ['Ride'],
    }),
    
    completeRide: builder.mutation({
      query: (data) => ({
        url: '/rides/complete',
        method: 'POST',
        body: data,
      }),
      // ⚡ OPTIMISTIC UPDATE : Clôture instantanée
      async onQueryStarted({ rideId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          ridesApiSlice.util.updateQueryData('getCurrentRide', undefined, (draft) => {
            if (draft && (draft._id === rideId || draft.id === rideId || draft.rideId === rideId)) {
              draft.status = 'completed';
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Ride'],
    }),

    emergencyCancelRide: builder.mutation({
      query: () => ({
        url: '/rides/emergency-cancel',
        method: 'POST',
      }),
      invalidatesTags: ['Ride'],
    }),

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