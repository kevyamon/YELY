// src/utils/maferePOIs.js
// DONNÉES GÉOSPATIALES - Points d'intérêt (POI) de Maféré
// CSCSM Level: Bank Grade

// 🚀 NOTE ARCHITECTE : 
// Ces données sont statiques pour le moment. À terme, elles seront 
// remplacées/complétées par un appel API vers le backend (Superadmin Dashboard).

export const MAFERE_POIS = [
  {
    id: 'poi-marche-001',
    name: 'Marché de Maféré',
    latitude: 5.4115,     // Coordonnées fictives proches du centre
    longitude: -3.0315,
    icon: 'cart',         // Nom de l'icône Ionicons
    iconColor: '#D4AF37'  // Or Champagne
  },
  {
    id: 'poi-pharmacie-001',
    name: 'Pharmacie Principale',
    latitude: 5.4130,
    longitude: -3.0330,
    icon: 'medkit',
    iconColor: '#2ECC71'  // Vert santé
  },
  {
    id: 'poi-gare-001',
    name: 'Gare Routière',
    latitude: 5.4080,
    longitude: -3.0290,
    icon: 'bus',
    iconColor: '#E74C3C'  // Rouge
  }
];