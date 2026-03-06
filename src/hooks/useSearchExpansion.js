// src/hooks/useSearchExpansion.js
// HOOK UI - Gestion isolee de l'etat visuel du radar de recherche
// CSCSM Level: Bank Grade / Bulletproof

import { useEffect, useState } from 'react';
import socketService from '../services/socketService';

const useSearchExpansion = (initialRadius = 1000, isActive = false) => {
  const [radius, setRadius] = useState(initialRadius);

  // SECURITE 1 : Synchronisation absolue avec Redux.
  // Si le socket echoue, mais que RTK Query rafraichit la data depuis la BDD, l'UI se mettra a jour.
  useEffect(() => {
    setRadius((prev) => (initialRadius > prev ? initialRadius : prev));
  }, [initialRadius]);

  // SECURITE 2 : Ecouteur Socket temps reel
  useEffect(() => {
    if (!isActive) return;

    const handleSearchExpanded = (data) => {
      if (data && data.radius) {
        const newRadius = Number(data.radius);
        setRadius(newRadius);
      }
    };

    socketService.on('search_expanded', handleSearchExpanded);

    return () => {
      socketService.off('search_expanded', handleSearchExpanded);
    };
  }, [isActive]);

  let title = "Recherche de chauffeurs...";
  let subtitle = "Nous interrogeons les vehicules a proximite.";

  if (radius >= 1900) {
    title = "Recherche maximale...";
    subtitle = "Encore un instant, nous cherchons au plus loin...";
  } else if (radius >= 1600) {
    title = "Recherche elargie...";
    subtitle = "Recherche de chauffeurs plus eloignes...";
  } else if (radius >= 1300) {
    title = "Agrandissement du radar...";
    subtitle = "Extension de la zone de recherche...";
  }

  return { title, subtitle, radius };
};

export default useSearchExpansion;