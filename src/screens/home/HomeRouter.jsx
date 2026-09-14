// src/screens/home/HomeRouter.jsx
// ROUTEUR D'ACCUEIL — Point d'entrée stable par rôle & Récepteur Post-Paiement
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis)

import * as Linking from 'expo-linking';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLazyVerifyPaymentQuery } from '../../store/api/subscriptionApiSlice';
import { apiSlice } from '../../store/slices/apiSlice';
import { selectCurrentUser, setSubscriptionModalDismissed, updateSubscriptionStatus } from '../../store/slices/authSlice';
import { showSuccessToast } from '../../store/slices/uiSlice';

import DriverHome from './DriverHome';
import RiderHome from './RiderHome';
import SellerHome from './SellerHome';

/**
 * Ce composant est le seul écran "Home" enregistré dans le Navigator.
 * Sa structure est STABLE — le Navigator ne la voit jamais changer.
 * C'est lui qui décide quel écran afficher selon le rôle, PAS le Navigator.
 * Il intercepte également les retours de paiement pour valider l'abonnement en tâche de fond.
 */
const HomeRouter = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const role = user?.role;
  const [verifyPaymentTrigger] = useLazyVerifyPaymentQuery();
  const processedRef = useRef(false);

  useEffect(() => {
    const handlePaymentReturn = async (urlStr, params) => {
      const isPaymentSuccess = params?.payment === 'success' || params?.status === 'success';
      const reference = params?.reference || params?.transaction_id || params?.id;

      if ((isPaymentSuccess || reference) && !processedRef.current) {
        processedRef.current = true;
        dispatch(setSubscriptionModalDismissed(true));
        dispatch(updateSubscriptionStatus({ isActive: true, isPending: false }));
        dispatch(showSuccessToast({ 
          title: 'Paiement Validé', 
          message: 'Votre abonnement est désormais actif.' 
        }));
        dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));

        if (reference) {
          try {
            await verifyPaymentTrigger(reference).unwrap();
            dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
          } catch (_) {}
        }
      }
    };

    // 1. Détection via route params
    if (route?.params) {
      handlePaymentReturn(null, route.params);
    }

    // 2. Détection via Linking Listener (Deep Links à chaud)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      try {
        const parsed = Linking.parse(url);
        if (parsed.queryParams) {
          handlePaymentReturn(url, parsed.queryParams);
        }
      } catch (_) {}
    });

    return () => {
      subscription.remove();
    };
  }, [route?.params, dispatch, verifyPaymentTrigger]);

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
