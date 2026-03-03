// src/store/api/adminApiSlice.js

import { apiSlice } from '../slices/apiSlice';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => '/api/admin/stats',
      providesTags: ['Stats'],
    }),
    getPendingTransactions: builder.query({
      query: ({ page = 1 }) => `/api/admin/validations?page=${page}`,
      providesTags: ['Transaction'],
    }),
    approveTransaction: builder.mutation({
      query: ({ transactionId }) => ({
        url: `/api/admin/approve/${transactionId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Transaction', 'Stats', 'Subscription'],
    }),
    rejectTransaction: builder.mutation({
      query: ({ transactionId, reason }) => ({
        url: `/api/admin/reject/${transactionId}`,
        method: 'POST',
        body: { reason },
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
    toggleUserBan: builder.mutation({
      query: ({ userId, reason }) => ({
        url: `/api/admin/toggle-ban`,
        method: 'POST',
        body: { userId, reason },
      }),
      invalidatesTags: ['User'],
    }),
    updateUserRole: builder.mutation({
      query: ({ userId, action }) => ({
        url: `/api/admin/update-role`,
        method: 'POST',
        body: { userId, action },
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
  useApproveTransactionMutation,
  useRejectTransactionMutation,
  useGetAllUsersQuery,
  useToggleUserBanMutation,
  useUpdateUserRoleMutation,
  useTogglePromoMutation,
  useGetFinanceDataQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} = adminApiSlice;