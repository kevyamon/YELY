// src/config/helpConfig.js
// CONFIGURATION MODULAIRE - Catalogue des vidéos d'aide (Streaming distant)
// CSCSM Level: Bank Grade

export const HELP_CATALOG = {
  rider: [
    {
      id: 'rider-1',
      title: 'Comment commander une course ?',
      description: 'Apprenez à définir votre destination et trouver un chauffeur rapidement.',
      videoSource: 'https://res.cloudinary.com/dcrdkr4nw/video/upload/v1773498630/commander_taxi_owrjsf.mp4', 
    },
    {
      id: 'rider-2',
      title: 'Gérer mon profil et mes trajets',
      description: 'Configurez votre compte et consultez votre historique en toute sécurité.',
      videoSource: 'https://res.cloudinary.com/dcrdkr4nw/video/upload/v1773498726/gestion_mkwu4r.mp4',
    }
  ],
  driver: [
    {
      id: 'driver-1',
      title: 'Comment accepter une course ?',
      description: 'Découvrez l\'interface de réception de commandes et de navigation.',
      videoSource: 'https://res.cloudinary.com/dcrdkr4nw/video/upload/v1773498962/accepter_course_pcnk1r.mp4',
    },
    {
      id: 'driver-2',
      title: 'Gérer mon véhicule et mes gains',
      description: 'Suivez vos revenus quotidiens et modifiez les informations de votre véhicule.',
      videoSource: 'https://res.cloudinary.com/dcrdkr4nw/video/upload/v1773498911/gestion_Client_papwf6.mp4',
    }
  ]
};