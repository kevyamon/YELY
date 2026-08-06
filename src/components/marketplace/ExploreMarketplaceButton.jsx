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
        navigation.navigate('MarketplaceHub', { screen: 'Accueil' });
      } catch (err) {
        try {
          navigation.navigate('MarketplaceHub');
        } catch (err2) {
          try {
            navigation.navigate('Accueil');
          } catch (err3) {
            navigation.navigate('Home');
          }
        }
      }
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
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
