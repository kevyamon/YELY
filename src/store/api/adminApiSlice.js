// src/store/api/adminApiSlice.js
// GESTIONNAIRE D'API ADMIN - Contrats stricts et invalidation dynamique
// CSCSM Level: Bank Grade

import { apiSlice } from '../slices/apiSlice';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => '/api/admin/stats',
      providesTags: ['Stats'],
    }),
    
    getValidationQueue: builder.query({
      query: (page = 1) => `/api/admin/validations?page=${page}`,
      providesTags: ['Transaction'],
    }),
    
    approveTransaction: builder.mutation({
      query: (transactionId) => ({
        url: `/api/admin/approve/${transactionId}`,
        method: 'POST',
      }),
      // Invalidation agressive pour forcer le rafraichissement des listes et des KPIs
      invalidatesTags: ['Transaction', 'Stats', 'Subscription', 'Notification'],
    }),
    
    rejectTransaction: builder.mutation({
      query: ({ transactionId, reason }) => ({
        url: `/api/admin/reject/${transactionId}`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Transaction', 'Stats', 'Subscription', 'Notification'],
    }),
    
    getAllUsers: builder.query({
      query: ({ page = 1, role, search }) => {
        let url = `/api/admin/users?page=${page}`;
        if (role) url += `&role=${role}`;
        if (search) url += `&search=${search}`;
        return url;
      },
      providesTags: ['User'],
    }),
    
    toggleUserBan: builder.mutation({
      query: ({ userId, reason }) => ({
        url: `/api/admin/toggle-ban`,
        method: 'POST',
        body: { userId, reason },
      }),
      invalidatesTags: ['User', 'Stats'],
    }),
    
    updateUserRole: builder.mutation({
      query: ({ userId, action }) => ({
        url: `/api/admin/update-role`,
        method: 'POST',
        body: { userId, action },
      }),
      invalidatesTags: ['User'],
    }),
    
    getFinanceData: builder.query({
      query: ({ period }) => `/api/admin/finance?period=${period || 'month'}`,
      providesTags: ['Stats'],
    }),
    
    updateWaveLinks: builder.mutation({
      query: ({ weeklyLink, monthlyLink }) => ({
        url: '/api/admin/finance/links',
        method: 'PUT',
        body: { weeklyLink, monthlyLink },
      }),
      invalidatesTags: ['Stats'],
    }),
    
    togglePromo: builder.mutation({
      query: ({ isActive }) => ({
        url: '/api/admin/promo/toggle',
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: ['Stats'],
    }),
    
    updateMapSettings: builder.mutation({
      query: (data) => ({
        url: '/api/admin/map-lock',
        method: 'POST',
        body: data,
      }),
      // Si la map change, on notifie potentiellement tout le monde (rechargement config globale)
      invalidatesTags: ['MapSettings'],
    }),
    
    getNotifications: builder.query({
      query: () => '/api/notifications',
      providesTags: ['Notification'],
    }),
    
    markNotificationsRead: builder.mutation({
      query: () => ({
        url: '/api/notifications/mark-read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
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