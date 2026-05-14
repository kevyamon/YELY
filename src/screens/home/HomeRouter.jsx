// src/screens/home/HomeRouter.jsx
// ROUTEUR D'ACCUEIL — Point d'entrée stable par rôle
// Remplace ChoiceHome : garde la structure du Navigator fixe
// CSCSM Level: Bank Grade

import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';

import DriverHome from './DriverHome';
import RiderHome from './RiderHome';
import SellerHome from './SellerHome';

/**
 * Ce composant est le seul écran "Home" enregistré dans le Navigator.
 * Sa structure est STABLE — le Navigator ne la voit jamais changer.
 * C'est lui qui décide quel écran afficher selon le rôle, PAS le Navigator.
 * Cela évite les re-rendus du Navigator et les boucles infinies associées.
 */
const HomeRouter = ({ navigation, route }) => {
  const user = useSelector(selectCurrentUser);
  const role = user?.role;

  return React.useMemo(() => {
    if (role === 'driver') {
      return <DriverHome navigation={navigation} route={route} />;
    }

    if (role === 'seller') {
      return <SellerHome navigation={navigation} route={route} />;
    }

    // Par défaut : rider (y compris si role est undefined pendant le boot)
    return <RiderHome navigation={navigation} route={route} />;
  }, [role, navigation, route]);
};

export default HomeRouter;
