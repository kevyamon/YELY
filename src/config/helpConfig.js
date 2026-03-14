// src/config/helpConfig.js
// CONFIGURATION MODULAIRE - Catalogue des vidéos d'aide
// CSCSM Level: Bank Grade

export const HELP_CATALOG = {
  rider: [
    {
      id: 'rider-1',
      title: 'Comment commander une course ?',
      description: 'Apprenez à définir votre destination et trouver un chauffeur rapidement.',
      // Remplacer require par une URL ('https://...') en production pour alléger l'application
      videoSource: require('../../assets/videos/rider_commande.mp4'), 
    },
    {
      id: 'rider-2',
      title: 'Gérer mon profil et mes trajets',
      description: 'Configurez votre compte et consultez votre historique en toute sécurité.',
      videoSource: require('../../assets/videos/rider_profil.mp4'),
    }
  ],
  driver: [
    {
      id: 'driver-1',
      title: 'Comment accepter une course ?',
      description: 'Découvrez l\'interface de réception de commandes et de navigation.',
      videoSource: require('../../assets/videos/driver_accepter.mp4'),
    },
    {
      id: 'driver-2',
      title: 'Gérer mon véhicule et mes gains',
      description: 'Suivez vos revenus quotidiens et modifiez les informations de votre véhicule.',
      videoSource: require('../../assets/videos/driver_vehicule.mp4'),
    }
  ]
};