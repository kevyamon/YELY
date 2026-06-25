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

    getSubscriptions: builder.query({
      query: ({ page = 1, role, search, status }) => {
        let url = `/admin/subscriptions?page=${page}`;
        if (role) url += `&role=${role}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: ['User'],
    }),

    getSubscriptionHistory: builder.query({
      query: (userId) => `/admin/subscriptions/history/${userId}`,
      providesTags: ['Transaction'],
    }),

    toggleSubscriptionBan: builder.mutation({
      query: ({ userId, reason }) => ({
        url: `/admin/subscriptions/toggle-ban`,
        method: 'POST',
        body: { userId, reason },
      }),
      invalidatesTags: ['User', 'Stats', 'AuditLog'],
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

    getAllRides: builder.query({
      query: ({ page = 1, limit = 50, isArchived = false }) => `/admin/rides?page=${page}&limit=${limit}&isArchived=${isArchived}`,
      providesTags: ['Stats'],
    }),
    
    toggleRideArchive: builder.mutation({
      query: (rideId) => ({
        url: `/admin/rides/${rideId}/archive`,
        method: 'PUT',
      }),
      invalidatesTags: ['Stats'],
    }),

    getMarketplaceStats: builder.query({
      query: () => '/admin/marketplace/stats',
      providesTags: ['MarketplaceStats'],
    }),

    getMarketplaceOrders: builder.query({
      query: ({ page = 1, status, search }) => {
        let url = `/admin/marketplace/orders?page=${page}`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: ['MarketplaceOrders'],
    }),

    overrideMarketplaceOrder: builder.mutation({
      query: ({ orderId, status, driverId, cancelRide, reason }) => ({
        url: `/admin/marketplace/orders/${orderId}/override`,
        method: 'PUT',
        body: { status, driverId, cancelRide, reason },
      }),
      invalidatesTags: ['MarketplaceOrders', 'MarketplaceStats', 'AuditLog'],
    }),

    getMarketplaceLedgers: builder.query({
      query: ({ page = 1, status, search }) => {
        let url = `/admin/marketplace/ledgers?page=${page}`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: ['MarketplaceLedgers'],
    }),

    forceClearLedger: builder.mutation({
      query: ({ ledgerId, reason }) => ({
        url: `/admin/marketplace/ledgers/${ledgerId}/force-clear`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: ['MarketplaceLedgers', 'MarketplaceStats', 'AuditLog'],
    }),

    getPendingDrivers: builder.query({
      query: ({ page = 1 } = {}) => `/admin/drivers/pending?page=${page}`,
      providesTags: ['User'],
    }),

    verifyDriver: builder.mutation({
      query: ({ id, decision, reason }) => ({
        url: `/admin/drivers/${id}/verify`,
        method: 'POST',
        body: { decision, reason },
      }),
      invalidatesTags: ['User', 'Stats', 'AuditLog'],
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
  useGetSubscriptionsQuery,
  useGetSubscriptionHistoryQuery,
  useToggleSubscriptionBanMutation,
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
  useGetAllRidesQuery,
  useToggleRideArchiveMutation,
  useGetMarketplaceStatsQuery,
  useGetMarketplaceOrdersQuery,
  useOverrideMarketplaceOrderMutation,
  useGetMarketplaceLedgersQuery,
  useForceClearLedgerMutation,
  useGetPendingDriversQuery,
  useVerifyDriverMutation,
} = adminApiSlice;