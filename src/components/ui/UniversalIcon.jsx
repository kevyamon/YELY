// src/components/ui/UniversalIcon.jsx
// MOTEUR DE RENDU MULTI-FAMILLES - Rétrocompatible et Anti-Crash
// CSCSM Level: Bank Grade

import { AntDesign, Feather, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

// Dictionnaire centralisé des familles autorisées
export const ICON_FAMILIES = {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign
};

const UniversalIcon = ({ iconString, size = 24, color = "black", style }) => {
  // 1. Sécurité anti-crash : si la donnée est corrompue ou absente
  if (!iconString || typeof iconString !== 'string') {
    return <Ionicons name="help-circle" size={size} color={color} style={style} />;
  }

  const parts = iconString.split('/');
  
  // 2. Nouveau format détecté (ex: "FontAwesome5/car")
  if (parts.length === 2) {
    const familyName = parts[0];
    const iconName = parts[1];
    const IconComponent = ICON_FAMILIES[familyName];
    
    if (IconComponent) {
      return <IconComponent name={iconName} size={size} color={color} style={style} />;
    }
  }

  // 3. Rétrocompatibilité absolue : Ancien format (ex: "restaurant")
  // On suppose que tous les anciens POIs étaient des Ionicons
  return <Ionicons name={iconString} size={size} color={color} style={style} />;
};

export default UniversalIcon;