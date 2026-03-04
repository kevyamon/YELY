// src/store/api/reportsApiSlice.js
// API DES SIGNALEMENTS - RTK Query
// CSCSM Level: Bank Grade

import { apiSlice } from '../slices/apiSlice';

export const reportsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    submitReport: builder.mutation({
      query: (formData) => ({
        url: '/reports/submit',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Report'],
    }),
    
    getMyReports: builder.query({
      query: () => '/reports/my-reports',
      providesTags: ['Report'],
    }),

    getAllReports: builder.query({
      query: () => '/reports/all',
      providesTags: ['Report'],
    }),

    resolveReport: builder.mutation({
      query: ({ id, note }) => ({
        url: `/reports/${id}/resolve`,
        method: 'PATCH',
        body: { note },
      }),
      invalidatesTags: ['Report', 'AuditLog'], 
    }),

    // 🚀 CORRECTION SENIOR: Séparation - Mutation côté Utilisateur (Client)
    deleteMyReport: builder.mutation({
      query: (id) => ({
        url: `/reports/my-reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Report'], 
    }),

    // 🚀 CORRECTION SENIOR: Séparation - Mutation côté Administration
    deleteAdminReport: builder.mutation({
      query: (id) => ({
        url: `/reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Report'], 
    }),
  }),
  overrideExisting: true,
});

export const { 
  useSubmitReportMutation, 
  useGetMyReportsQuery,
  useGetAllReportsQuery,
  useResolveReportMutation,
  useDeleteMyReportMutation,   // <-- Export pour l'App Client
  useDeleteAdminReportMutation // <-- Export pour le Dashboard Admin
} = reportsApiSlice;