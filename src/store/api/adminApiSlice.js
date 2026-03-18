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
      query: ({ page = 1, viewAll = false } = {}) => {
        let url = `/admin/validations?page=${page}`;
        if (viewAll) url += `&viewAll=true`;
        return url;
      },
      providesTags: ['Transaction'],
    }),
    
    approveTransaction: builder.mutation({
      query: (transactionId) => ({
        url: `/admin/approve/${transactionId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Transaction', 'Stats', 'Subscription', 'Notification', 'AuditLog'],
    }),
    
    rejectTransaction: builder.mutation({
      query: ({ transactionId, reason }) => ({
        url: `/admin/reject/${transactionId}`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Transaction', 'Stats', 'Subscription', 'Notification', 'AuditLog'],
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
      invalidatesTags: ['User', 'Stats', 'AuditLog'],
    }),
    
    updateUserRole: builder.mutation({
      query: ({ userId, action }) => ({
        url: `/admin/update-role`,
        method: 'POST',
        body: { userId, action },
      }),
      invalidatesTags: ['User', 'AuditLog'],
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
      invalidatesTags: ['Stats', 'AuditLog'],
    }),
    
    togglePromo: builder.mutation({
      query: ({ isActive }) => ({
        url: '/admin/promo/toggle',
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: ['Stats', 'AuditLog', 'Subscription'], 
    }),

    toggleLoadReduce: builder.mutation({
      query: () => ({
        url: '/admin/load-reduce/toggle',
        method: 'PUT',
      }),
      invalidatesTags: ['Stats', 'AuditLog'],
    }),

    // CORRECTION : Invalidation de SystemConfig pour reactivite en temps reel de l'interface admin
    toggleGlobalFreeAccess: builder.mutation({
      query: (payload) => ({
        url: '/admin/free-access/toggle',
        method: 'PUT',
        body: { 
          isGlobalFreeAccess: payload.isActive, 
          promoMessage: payload.promoMessage 
        },
      }),
      invalidatesTags: ['Stats', 'AuditLog', 'Subscription', 'SystemConfig'],
    }),
    
    updateMapSettings: builder.mutation({
      query: (data) => ({
        url: '/admin/map-lock',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MapSettings', 'AuditLog'],
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

    getAuditLogs: builder.query({
      query: ({ page = 1 }) => `/admin/logs?page=${page}`,
      providesTags: ['AuditLog'],
    }),

    getSystemConfig: builder.query({
      query: () => '/admin/system-config',
      providesTags: ['SystemConfig'],
    }),

    updateAppVersion: builder.mutation({
      query: (payload) => ({
        url: '/admin/app-version',
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['SystemConfig', 'AuditLog'],
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
  useToggleLoadReduceMutation,
  useToggleGlobalFreeAccessMutation,
  useUpdateMapSettingsMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useGetAuditLogsQuery,
  useGetSystemConfigQuery,
  useUpdateAppVersionMutation,
} = adminApiSlice;