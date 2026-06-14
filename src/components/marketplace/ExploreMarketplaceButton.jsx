// src/components/marketplace/ExploreMarketplaceButton.jsx
// BOUTON REUTILISABLE - Redirection optimisee vers le marche (Marketplace)
// CSCSM Level: Bank Grade

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import GoldButton from '../ui/GoldButton';

const ExploreMarketplaceButton = ({ 
  title = "Commencer mes achats", 
  icon = "cart-outline",
  style 
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    requestAnimationFrame(() => {
      navigation.navigate('MarketplaceHub', { screen: 'Accueil' });
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
