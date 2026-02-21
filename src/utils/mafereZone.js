// src/utils/mafereZone.js
// DONNÉES GÉOSPATIALES & INTELLIGENCE - Zone de couverture Yély (Maféré)
// CSCSM Level: Bank Grade

// Le centre de Maféré (récupéré depuis ton point KML exact : Placemark 0710D915EA3DB5A02706)
export const MAFERE_CENTER = {
  latitude: 5.4125925,
  longitude: -3.0325855
};

// 🚀 ZONE KML MAFÉRÉ (Polygone extrait de ton fichier Google Earth)
// L'application va tracer une ligne entre chaque point pour dessiner le périmètre
export const MAFERE_KML_ZONE = [
  { latitude: 5.397270619269481, longitude: -3.040652168545819 },
  { latitude: 5.397668188115847, longitude: -3.038715772727267 },
  { latitude: 5.406008760511635, longitude: -3.01928973350801 },
  { latitude: 5.410226011548936, longitude: -3.011328744569358 },
  { latitude: 5.417752156206156, longitude: -3.014210822997271 },
  { latitude: 5.425374885210843, longitude: -3.016555528345999 },
  { latitude: 5.432107025364943, longitude: -3.023175079427676 },
  { latitude: 5.432588116161526, longitude: -3.039256911883392 },
  { latitude: 5.425508636610378, longitude: -3.044358393789674 },
  { latitude: 5.416045751938407, longitude: -3.047970409295107 },
  { latitude: 5.406546901540048, longitude: -3.053424900375111 },
  { latitude: 5.397762357815283, longitude: -3.052274362850119 },
  { latitude: 5.397270619269481, longitude: -3.040652168545819 } // Le dernier point rejoint le premier pour fermer la boucle
];

/**
 * 🧠 Algorithme de Ray-Casting :
 * LOGIQUE MÉTIER : C'est le videur de la boîte de nuit. 
 * Il trace une ligne droite imaginaire depuis ta position. 
 * S'il coupe les bords de la zone de Maféré un nombre impair de fois, 
 * ça veut dire que tu es À L'INTÉRIEUR. Sinon, tu es À L'EXTÉRIEUR (ex: Abobo).
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