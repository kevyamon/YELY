// src/utils/mafereZone.js
// DONNÉES GÉOSPATIALES & INTELLIGENCE - Zone de couverture Yély
// CSCSM Level: Bank Grade

export const MAFERE_CENTER = {
  latitude: 5.4053,
  longitude: -3.0531
};

// 🚀 ZONE KML MAFÉRÉ (Remplace ces points par ton vrai tracé Google Earth)
export const MAFERE_KML_ZONE = [
  { latitude: 5.4350, longitude: -3.0750 },
  { latitude: 5.4300, longitude: -3.0350 },
  { latitude: 5.3850, longitude: -3.0300 },
  { latitude: 5.3800, longitude: -3.0800 },
];

/**
 * 🧠 Algorithme de Ray-Casting :
 * Vérifie si des coordonnées GPS se trouvent STRICTEMENT à l'intérieur du polygone (KML)
 */
export const isLocationInMafereZone = (location) => {
  if (!location || !location.latitude || !location.longitude) return false;
  
  const x = location.longitude;
  const y = location.latitude;
  let inside = false;
  
  const polygon = MAFERE_KML_ZONE;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude, yi = polygon[i].latitude;
    const xj = polygon[j].longitude, yj = polygon[j].latitude;

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};