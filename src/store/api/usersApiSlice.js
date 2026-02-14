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
    /* 
    // MÉTHODES DÉSACTIVÉES - PAS ENCORE IMPLÉMENTÉES BACKEND
    getUserProfile: builder.query({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),
    updateUserProfile: builder.mutation({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    uploadDocuments: builder.mutation({
      query: (formData) => ({
        url: '/auth/documents',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['User'],
    }),
    */
    updateAvailability: builder.mutation({
      query: (data) => ({
        url: '/auth/availability',
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
  /*
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUploadDocumentsMutation,
  */
  useUpdateAvailabilityMutation,
} = usersApiSlice;