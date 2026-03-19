// src/components/ui/UniversalIcon.jsx
// MOTEUR DE RENDU MULTI-FAMILLES - Rétrocompatible et Anti-Crash
// CSCSM Level: Bank Grade

import { AntDesign, Feather, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

export const ICON_FAMILIES = {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign
};

const UniversalIcon = ({ iconString, size = 24, color = "black", style }) => {
  // Sécurité absolue si la donnée est corrompue
  if (!iconString || typeof iconString !== 'string') {
    return <Ionicons name="help-circle" size={size} color={color} style={style} />;
  }

  // Nettoyage strict des espaces invisibles venant de la base de données
  const cleanString = iconString.trim();
  const parts = cleanString.split('/');
  
  if (parts.length === 2) {
    const familyName = parts[0].trim();
    const iconName = parts[1].trim();
    const IconComponent = ICON_FAMILIES[familyName];
    
    if (IconComponent) {
      // Rendu dynamique de la famille correspondante
      return <IconComponent name={iconName} size={size} color={color} style={style} />;
    }
  }

  // Fallback si c'est un ancien POI (ex: "location" au lieu de "Ionicons/location")
  return <Ionicons name={cleanString} size={size} color={color} style={style} />;
};

export default UniversalIcon;