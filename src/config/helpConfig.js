// src/config/helpConfig.js
// CONFIGURATION MODULAIRE - Catalogue des vidéos d'aide (Streaming distant)
// CSCSM Level: Bank Grade

const V1 = {
  id: 'market-order',
  title: 'Comment commander sur Yély ?',
  description: 'Apprenez à commander des articles sur la marketplace en quelques clics.',
  videoSource: 'https://res.cloudinary.com/dskdkrwhq/video/upload/v1781167199/lv_0_20260611080904_khj4gh.mp4',
};

export const HELP_CATALOG = {
  rider: [
    {
      id: 'rider-1',
      title: 'Comment commander une course ?',
      description: 'Apprenez à définir votre destination et trouver un chauffeur rapidement.',
      videoSource: 'https://res.cloudinary.com/dcrdkr4nw/video/upload/v1773498630/commander_taxi_owrjsf.mp4', 
    },
    V1,
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
    V1,
    {
      id: 'driver-3',
      title: 'Comment effectuer une livraison ?',
      description: 'Apprenez les étapes pour livrer efficacement une commande client.',
      videoSource: 'https://res.cloudinary.com/dskdkrwhq/video/upload/v1781453186/lv_0_20260614160338_cg8vkw.mp4',
    },
    {
      id: 'driver-2',
      title: 'Gérer mon véhicule et mes gains',
      description: 'Suivez vos revenus quotidiens et modifiez les informations de votre véhicule.',
      videoSource: 'https://res.cloudinary.com/dcrdkr4nw/video/upload/v1773498911/gestion_Client_papwf6.mp4',
    }
  ],
  seller: [
    V1,
    {
      id: 'seller-1',
      title: 'Gérer mes commandes (Accepter / Refuser)',
      description: 'Tutoriel complet pour accepter, préparer ou refuser une commande reçue.',
      videoSource: 'https://res.cloudinary.com/dskdkrwhq/video/upload/v1781167272/lv_0_20260611083735_m64wem.mp4',
    }
  ]
};