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
  if (!iconString || typeof iconString !== 'string') {
    return <Ionicons name="help-circle" size={size} color={color} style={style} />;
  }

  // CORRECTION : Nettoyage des espaces cachés qui crashent la vue native
  const cleanString = iconString.trim();
  const parts = cleanString.split('/');
  
  if (parts.length === 2) {
    const familyName = parts[0];
    const iconName = parts[1].trim(); // Nettoyage de la deuxième partie
    const IconComponent = ICON_FAMILIES[familyName];
    
    if (IconComponent) {
      // CORRECTION MAJEURE : FontAwesome5 exige la prop "solid" sur React Native pour afficher 90% de ses icônes
      if (familyName === 'FontAwesome5') {
        return <IconComponent name={iconName} size={size} color={color} style={style} solid />;
      }
      return <IconComponent name={iconName} size={size} color={color} style={style} />;
    }
  }

  return <Ionicons name={cleanString} size={size} color={color} style={style} />;
};

export default UniversalIcon;