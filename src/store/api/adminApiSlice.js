// src/store/api/adminApiSlice.js
// GESTIONNAIRE D'API ADMIN - Contrats stricts et invalidation dynamique
// CSCSM Level: Bank Grade

import { apiSlice } from '../slices/apiSlice';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['Stats'],
    }),
    
    getValidationQueue: builder.query({
      query: (page = 1) => `/admin/validations?page=${page}`,
      providesTags: ['Transaction'],
    }),
    
    approveTransaction: builder.mutation({
      query: (transactionId) => ({
        url: `/admin/approve/${transactionId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Transaction', 'Stats', 'Subscription', 'Notification'],
    }),
    
    rejectTransaction: builder.mutation({
      query: ({ transactionId, reason }) => ({
        url: `/admin/reject/${transactionId}`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Transaction', 'Stats', 'Subscription', 'Notification'],
    }),
    
    getAllUsers: builder.query({
      query: ({ page = 1, role, search }) => {
        let url = `/admin/users?page=${page}`;
        if (role) url += `&role=${role}`;
        if (search) url += `&search=${search}`;
        return url;
      },
      providesTags: ['User'],
    }),
    
    toggleUserBan: builder.mutation({
      query: ({ userId, reason }) => ({
        url: `/admin/toggle-ban`,
        method: 'POST',
        body: { userId, reason },
      }),
      invalidatesTags: ['User', 'Stats'],
    }),
    
    updateUserRole: builder.mutation({
      query: ({ userId, action }) => ({
        url: `/admin/update-role`,
        method: 'POST',
        body: { userId, action },
      }),
      invalidatesTags: ['User'],
    }),
    
    getFinanceData: builder.query({
      query: ({ period }) => `/admin/finance?period=${period || 'month'}`,
      providesTags: ['Stats'],
    }),
    
    updateWaveLinks: builder.mutation({
      query: ({ weeklyLink, monthlyLink }) => ({
        url: '/admin/finance/links',
        method: 'PUT',
        body: { weeklyLink, monthlyLink },
      }),
      invalidatesTags: ['Stats'],
    }),
    
    togglePromo: builder.mutation({
      query: ({ isActive }) => ({
        url: '/admin/promo/toggle',
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: ['Stats'],
    }),
    
    updateMapSettings: builder.mutation({
      query: (data) => ({
        url: '/admin/map-lock',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MapSettings'],
    }),
    
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    
    markNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardStatsQuery,
  useGetValidationQueueQuery,
  useApproveTransactionMutation,
  useRejectTransactionMutation,
  useGetAllUsersQuery,
  useToggleUserBanMutation,
  useUpdateUserRoleMutation,
  useGetFinanceDataQuery,
  useUpdateWaveLinksMutation,
  useTogglePromoMutation,
  useUpdateMapSettingsMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} = adminApiSlice;