// src/hooks/useSearchExpansion.js
// HOOK UI - Gestion isolee de l'etat visuel du radar de recherche
// CSCSM Level: UI Polish

import { useEffect, useState } from 'react';
import socketService from '../services/socketService';

const useSearchExpansion = (initialRadius = 1000, isActive = false) => {
  const [radius, setRadius] = useState(initialRadius);

  useEffect(() => {
    if (initialRadius > radius) {
      setRadius(initialRadius);
    }
  }, [initialRadius]);

  useEffect(() => {
    if (!isActive) return;

    const handleSearchExpanded = (data) => {
      if (data && data.radius) {
        setRadius(Number(data.radius));
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