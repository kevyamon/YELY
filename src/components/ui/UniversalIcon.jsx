// src/components/ui/UniversalIcon.jsx
// MOTEUR DE RENDU MULTI-FAMILLES - Retrocompatible et Anti-Crash
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
  // Securite absolue si la donnee est corrompue
  if (!iconString || typeof iconString !== 'string') {
    return <Ionicons name="help-circle" size={size} color={color} style={style} />;
  }

  // Nettoyage strict des espaces invisibles (Anti Zero-Width-Space) et des espaces classiques
  const cleanString = iconString.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  const parts = cleanString.split('/');
  
  if (parts.length === 2) {
    const rawFamilyName = parts[0].trim();
    const iconName = parts[1].trim();
    
    // Recherche insensible a la casse pour eviter les crashs dus aux erreurs de saisie (ex: "ionicons" au lieu de "Ionicons")
    const familyKey = Object.keys(ICON_FAMILIES).find(
      key => key.toLowerCase() === rawFamilyName.toLowerCase()
    );

    if (familyKey) {
      const IconComponent = ICON_FAMILIES[familyKey];
      
      // Injection dynamique de la prop "solid" specifiquement pour FontAwesome5 sur l'environnement Mobile
      const isFontAwesome5 = familyKey === 'FontAwesome5';

      return (
        <IconComponent 
          name={iconName} 
          size={size} 
          color={color} 
          style={style} 
          solid={isFontAwesome5 ? true : undefined} 
        />
      );
    }
  }

  // Fallback securise : Si la famille n'est pas trouvee, on extrait uniquement le nom de l'icone pour le donner a Ionicons.
  const fallbackIconName = parts.length === 2 ? parts[1].trim() : cleanString;
  
  return <Ionicons name={fallbackIconName} size={size} color={color} style={style} />;
};

export default UniversalIcon;