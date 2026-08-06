// src/components/marketplace/ExploreMarketplaceButton.jsx
// BOUTON REUTILISABLE - Redirection optimisee vers le marche (Marketplace)
// CSCSM Level: Bank Grade

import React, { useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import GoldButton from '../ui/GoldButton';

const ExploreMarketplaceButton = ({ 
  title = "Commencer mes achats", 
  icon = "cart-outline",
  style 
}) => {
  const navigation = useNavigation();
  const isNavigatingRef = useRef(false);

  const handlePress = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    requestAnimationFrame(() => {
      try {
        navigation.navigate('Accueil');
      } catch (err) {
        navigation.navigate('MarketplaceHub');
      }
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    });
  };

  return (
    <GoldButton
      title={title}
      icon={icon}
      onPress={handlePress}
      fullWidth={false}
      style={style}
    />
  );
};

export default ExploreMarketplaceButton;
