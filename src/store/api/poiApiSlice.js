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
    
    // Récupérer tous les lieux pour l'administration (actifs et inactifs)
    getAdminPOIs: builder.query({
      query: () => '/pois/admin',
      providesTags: ['POI'],
    }),

    // Rechercher des lieux dynamiquement (local + Nominatim/Google)
    searchPOIs: builder.query({
      query: (q) => `/pois/search?q=${encodeURIComponent(q)}`,
      providesTags: ['POI'],
    }),

    // Résoudre et mettre en cache un lieu externe sélectionné
    resolveExternalPOI: builder.mutation({
      query: (poi) => ({
        url: '/pois/resolve-external',
        method: 'POST',
        body: poi,
      }),
      invalidatesTags: ['POI'],
    }),

    // Proposer un lieu (Riders/Drivers)
    suggestPOI: builder.mutation({
      query: (poi) => ({
        url: '/pois/suggest',
        method: 'POST',
        body: poi,
      }),
      invalidatesTags: ['POI'],
    }),

    // Importation automatique depuis OSM
    autoImportPOIs: builder.mutation({
      query: (body) => ({
        url: '/pois/auto-import',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['POI'],
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
  useGetAdminPOIsQuery,
  useSearchPOIsQuery,
  useResolveExternalPOIMutation,
  useSuggestPOIMutation,
  useAutoImportPOIsMutation,
  useCreatePOIMutation,
  useUpdatePOIMutation,
  useDeletePOIMutation,
  useBulkImportPOIsMutation,
} = poiApiSlice;