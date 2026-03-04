// src/store/api/notificationsApiSlice.js
import { apiSlice } from '../slices/apiSlice';

export const notificationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 1 }) => `/notifications?page=${page}`,
      providesTags: ['Notification'],
    }),
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
  overrideExisting: true, // RÉPARE L'ERREUR D'INJECTION
});

export const { useGetNotificationsQuery, useMarkAsReadMutation } = notificationsApiSlice;