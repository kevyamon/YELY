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
    // 🚀 AJOUT SENIOR: Mutation pour supprimer
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
  overrideExisting: true, 
});

export const { 
  useGetNotificationsQuery, 
  useMarkAsReadMutation,
  useDeleteNotificationMutation // <-- Export du Hook !
} = notificationsApiSlice;