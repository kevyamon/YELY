// src/store/api/reportsApiSlice.js
import { apiSlice } from '../slices/apiSlice';

export const reportsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    submitReport: builder.mutation({
      query: (formData) => ({
        url: '/reports/submit',
        method: 'POST',
        body: formData,
        formData: true,
      }),
    }),
    getMyReports: builder.query({
      query: () => '/reports/my-reports',
    }),
  }),
  overrideExisting: true,
});

export const { useSubmitReportMutation, useGetMyReportsQuery } = reportsApiSlice;