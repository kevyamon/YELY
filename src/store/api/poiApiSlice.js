// src/store/api/poiApiSlice.js [NOUVEAU]
// COMMUNICATION AVEC L'API - Gestion des Lieux (POI)
// CSCSM Level: Bank Grade

import { apiSlice } from '../slices/apiSlice';

export const poiApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Récupérer tous les lieux actifs (Pour tout le monde)
    getAllPOIs: builder.query({
      query: () => '/pois',
      providesTags: ['POI'], // Permet de rafraîchir automatiquement si on modifie un lieu
    }),
    
    // Créer un lieu (SuperAdmin)
    createPOI: builder.mutation({
      query: (newPOI) => ({
        url: '/pois',
        method: 'POST',
        body: newPOI,
      }),
      invalidatesTags: ['POI'], // Force le rechargement de la liste après l'ajout
    }),

    // Modifier un lieu (SuperAdmin)
    updatePOI: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/pois/${id}`,
      method: 'PUT',
        body: updatedData,
      }),
      invalidatesTags: ['POI'],
    }),

    // Supprimer un lieu (SuperAdmin)
    deletePOI: builder.mutation({
      query: (id) => ({
        url: `/pois/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['POI'],
    }),

    // Import en masse (SuperAdmin)
    bulkImportPOIs: builder.mutation({
      query: (poisData) => ({
        url: '/pois/bulk-import',
        method: 'POST',
        body: poisData, // Doit être sous la forme { pois: [...] }
      }),
      invalidatesTags: ['POI'],
    }),
  }),
});

export const {
  useGetAllPOIsQuery,
  useCreatePOIMutation,
  useUpdatePOIMutation,
  useDeletePOIMutation,
  useBulkImportPOIsMutation,
} = poiApiSlice;