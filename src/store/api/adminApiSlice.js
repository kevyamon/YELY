// src/store/api/adminApiSlice.js

import { apiSlice } from '../slices/apiSlice';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => '/api/admin/stats',
      providesTags: ['Stats'],
    }),
    getPendingTransactions: builder.query({
      query: ({ type }) => `/api/admin/transactions/pending${type ? `?type=${type}` : ''}`,
      providesTags: ['Transaction'],
    }),
    validateTransaction: builder.mutation({
      query: ({ transactionId, action, reason }) => ({
        url: `/api/admin/transactions/${transactionId}/validate`,
        method: 'PUT',
        body: { action, reason },
      }),
      invalidatesTags: ['Transaction', 'Stats', 'Subscription'],
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
    banUser: builder.mutation({
      query: ({ userId, reason }) => ({
        url: `/api/admin/users/${userId}/ban`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: ['User'],
    }),
    unbanUser: builder.mutation({
      query: ({ userId }) => ({
        url: `/api/admin/users/${userId}/unban`,
        method: 'PUT',
      }),
      invalidatesTags: ['User'],
    }),
    promoteToAdmin: builder.mutation({
      query: ({ userId }) => ({
        url: `/api/admin/users/${userId}/promote`,
        method: 'PUT',
      }),
      invalidatesTags: ['User'],
    }),
    revokeAdmin: builder.mutation({
      query: ({ userId }) => ({
        url: `/api/admin/users/${userId}/revoke`,
        method: 'PUT',
      }),
      invalidatesTags: ['User'],
    }),
    togglePromo: builder.mutation({
      query: ({ isActive }) => ({
        url: '/api/admin/promo/toggle',
        method: 'PUT',
        body: { isActive },
      }),
    }),
    getFinanceData: builder.query({
      query: ({ period }) => `/api/admin/finance?period=${period || 'month'}`,
      providesTags: ['Stats'],
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
  useGetPendingTransactionsQuery,
  useValidateTransactionMutation,
  useGetAllUsersQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  usePromoteToAdminMutation,
  useRevokeAdminMutation,
  useTogglePromoMutation,
  useGetFinanceDataQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} = adminApiSlice;