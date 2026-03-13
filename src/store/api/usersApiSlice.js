// src/store/api/usersApiSlice.js

import { apiSlice } from '../slices/apiSlice';

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: '/auth/login',
        method: 'POST',
        body: data,
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
    getUserProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    updateUserProfile: builder.mutation({
      query: (data) => ({
        url: '/users/update-profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    uploadProfilePicture: builder.mutation({
      query: (formData) => ({
        url: '/users/profile-picture',
        method: 'PATCH',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['User'],
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: '/users/account',
        method: 'DELETE',
      }),
    }),
    updateAvailability: builder.mutation({
      query: (data) => ({
        url: '/auth/availability',
        method: 'PUT',
        body: data,
      }),
    }),
    // NOUVELLE MUTATION : Mise a jour propre du Token FCM via RTK Query
    updateFcmToken: builder.mutation({
      query: (data) => ({
        url: '/auth/fcm-token',
        method: 'PUT',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUploadProfilePictureMutation,
  useDeleteAccountMutation,
  useUpdateAvailabilityMutation,
  useUpdateFcmTokenMutation, // Export du hook
} = usersApiSlice;