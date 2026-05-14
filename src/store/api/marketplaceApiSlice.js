// src/store/api/marketplaceApiSlice.js
import { apiSlice } from '../slices/apiSlice';

export const marketplaceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Produits
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params: params,
      }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    toggleSoldOut: builder.mutation({
      query: (id) => ({
        url: `/products/${id}/toggle-sold-out`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Product'],
    }),

    // Commandes
    createOrder: builder.mutation({
      query: (data) => ({
        url: '/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),
    getMyOrders: builder.query({
      query: () => '/orders/my-orders',
      providesTags: ['Order'],
    }),
    getSellerOrders: builder.query({
      query: () => '/orders/seller-orders',
      providesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status, comment }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status, comment },
      }),
      invalidatesTags: ['Order'],
    }),

    // Ledger
    getMyLedger: builder.query({
      query: () => '/ledger',
      providesTags: ['Ledger'],
    }),
    getLedgerStats: builder.query({
      query: () => '/ledger/stats',
      providesTags: ['Ledger'],
    }),
    clearLedgerEntry: builder.mutation({
      query: (id) => ({
        url: `/ledger/${id}/clear`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Ledger'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useToggleSoldOutMutation,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetSellerOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetMyLedgerQuery,
  useGetLedgerStatsQuery,
  useClearLedgerEntryMutation,
} = marketplaceApiSlice;
