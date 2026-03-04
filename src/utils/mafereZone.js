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
  { latitude: 5.399031034336893, longitude: -3.049977159237306 },
  { latitude: 5.396533530602768, longitude: -3.039240846090227 },
  { latitude: 5.402883250165573, longitude: -3.022268123621838 },
  { latitude: 5.398864024638002, longitude: -3.006604056658062 },
  { latitude: 5.411066839769147, longitude: -3.000589690214418 },
  { latitude: 5.419077431907107, longitude: -3.010884090788243 },
  { latitude: 5.42819734613291,  longitude: -3.01724570713425 },
  { latitude: 5.439339076645838, longitude: -3.027251167463914 },
  { latitude: 5.443699158653338, longitude: -3.033733326531315 },
  { latitude: 5.438598907936526, longitude: -3.040823722486742 },
  { latitude: 5.431327875881577, longitude: -3.04648564109407 },
  { latitude: 5.426230049035072, longitude: -3.050302653433072 },
  { latitude: 5.416122353529494, longitude: -3.052910524503075 },
  { latitude: 5.405230303678057, longitude: -3.055627252222842 },
  { latitude: 5.399031034336893, longitude: -3.049977159237306 } // Fermeture de la boucle
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