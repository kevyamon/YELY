// src/store/api/usersApiSlice.js

import { apiSlice } from '../slices/apiSlice';

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: '/api/users/login',
        method: 'POST',
        body: data,
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: '/api/users/register',
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/api/users/logout',
        method: 'POST',
      }),
    }),
    getUserProfile: builder.query({
      query: () => '/api/users/profile',
      providesTags: ['User'],
    }),
    updateUserProfile: builder.mutation({
      query: (data) => ({
        url: '/api/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    updateAvailability: builder.mutation({
      query: (data) => ({
        url: '/api/users/availability',
        method: 'PUT',
        body: data,
      }),
    }),
    uploadDocuments: builder.mutation({
      query: (formData) => ({
        url: '/api/users/documents',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUpdateAvailabilityMutation,
  useUploadDocumentsMutation,
} = usersApiSlice;