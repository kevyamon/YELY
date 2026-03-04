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
        // On laisse fetchBaseQuery gérer le Content-Type (multipart/form-data)
      }),
      invalidatesTags: ['Report'],
    }),
    
    getMyReports: builder.query({
      query: () => '/reports/my-reports',
      providesTags: ['Report'],
    }),

    // --- ROUTES ADMIN ---
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
      invalidatesTags: ['Report', 'AuditLog'], // Rafraîchit les signalements et le journal admin
    }),
  }),
  overrideExisting: true,
});

export const { 
  useSubmitReportMutation, 
  useGetMyReportsQuery,
  useGetAllReportsQuery,
  useResolveReportMutation 
} = reportsApiSlice;