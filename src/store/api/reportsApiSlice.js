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

    // AJOUT SENIOR: On pointe vers la nouvelle route utilisateur et on invalide le cache
    deleteReport: builder.mutation({
      query: (id) => ({
        url: `/reports/my-reports/${id}`,
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
  useDeleteReportMutation 
} = reportsApiSlice;