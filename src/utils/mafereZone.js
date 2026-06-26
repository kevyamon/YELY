// src/utils/mafereZone.js
// DONNÉES GÉOSPATIALES & INTELLIGENCE - Zone de couverture Yély (Maféré V2)
// CSCSM Level: Bank Grade

// Le centre de Maféré (Ajusté selon le nouveau polygone pour être bien au milieu)
export const MAFERE_CENTER = {
  latitude: 5.420000,
  longitude: -3.028000
};

// 🚀 ZONE KML MAFÉRÉ V2 (Mise à jour suite au relevé topographique "Maféré 2")
// Ce polygone est plus précis et couvre l'expansion réelle de la ville.
export const MAFERE_KML_ZONE = [
  { latitude: 5.389355738252305, longitude: -3.051197610717613 },
  { latitude: 5.389703322002365, longitude: -2.984380345561231 },
  { latitude: 5.427887081546217, longitude: -2.987065237052784 },
  { latitude: 5.443134554765992, longitude: -2.987269034128919 },
  { latitude: 5.449104421664392, longitude: -3.036311394541528 },
  { latitude: 5.445598242581576, longitude: -3.06092929087994 },
  { latitude: 5.433245102067395, longitude: -3.075460658993872 },
  { latitude: 5.417993563246123, longitude: -3.079244234523882 },
  { latitude: 5.404791835726621, longitude: -3.078000651410526 },
  { latitude: 5.389355738252305, longitude: -3.051197610717613 }
];

/**
 * 🧠 Algorithme de Ray-Casting :
 * LOGIQUE MÉTIER : Vérifie si un point GPS est dans le polygone.
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