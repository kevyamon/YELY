// src/screens/home/HomeRouter.jsx
// ROUTEUR D'ACCUEIL — Point d'entrée stable par rôle, Mur de Berlin Abonnement & Anti-Rebond
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis)

import * as Linking from 'expo-linking';
import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLazyVerifyPaymentQuery } from '../../store/api/subscriptionApiSlice';
import { apiSlice } from '../../store/slices/apiSlice';
import { 
  selectCurrentUser, 
  selectPromoMode, 
  selectSubscriptionStatus, 
  setSubscriptionModalDismissed, 
  updateSubscriptionStatus 
} from '../../store/slices/authSlice';
import { showSuccessToast } from '../../store/slices/uiSlice';

import DriverHome from './DriverHome';
import RiderHome from './RiderHome';
import SellerHome from './SellerHome';
import SubscriptionScreen from '../subscription/SubscriptionScreen';
import WaitScreen from '../subscription/WaitScreen';
import PaymentFailureScreen from '../subscription/PaymentFailure';

let globalLastHomePaymentToastTime = 0;

/**
 * Ce composant est le seul écran "Home" enregistré dans le Navigator.
 * Sa structure est STABLE — le Navigator ne la voit jamais changer.
 * C'est lui qui décide quel écran afficher selon le rôle et le statut d'abonnement.
 * Si un chauffeur ou vendeur n'a pas d'abonnement actif, il est bloqué sur le mur d'abonnement.
 */
const HomeRouter = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const subStatus = useSelector(selectSubscriptionStatus);
  const promoMode = useSelector(selectPromoMode);
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
        dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));

        const now = Date.now();
        if (now - globalLastHomePaymentToastTime > 25000) {
          globalLastHomePaymentToastTime = now;
          dispatch(showSuccessToast({ 
            title: 'Paiement Validé', 
            message: 'Votre abonnement est désormais actif.' 
          }));
        }

        if (reference) {
          try {
            await verifyPaymentTrigger(reference).unwrap();
            dispatch(apiSlice.util.invalidateTags(['Subscription', 'User']));
          } catch (_) {}
        }
      }
    };

    if (route?.params) {
      handlePaymentReturn(null, route.params);
    }

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

  const hasActiveAccess = useMemo(() => {
    return Boolean(
      subStatus?.isActive || 
      promoMode?.isActive || 
      user?.subscription?.isActive || 
      (user?.subscription?.expiresAt && new Date(user.subscription.expiresAt) > new Date())
    );
  }, [subStatus?.isActive, promoMode?.isActive, user?.subscription?.isActive, user?.subscription?.expiresAt]);

  const isPending = Boolean(subStatus?.isPending || user?.subscription?.isPending);
  const isRejected = Boolean(subStatus?.isRejected);

  return useMemo(() => {
    if (role === 'driver' || role === 'seller') {
      if (!hasActiveAccess) {
        if (isPending) {
          return <WaitScreen navigation={navigation} route={route} />;
        }
        if (isRejected) {
          return <PaymentFailureScreen navigation={navigation} route={route} />;
        }
        return <SubscriptionScreen navigation={navigation} route={route} />;
      }

      if (role === 'driver') {
        return <DriverHome navigation={navigation} route={route} />;
      }
      return <SellerHome navigation={navigation} route={route} />;
    }

    return <RiderHome navigation={navigation} route={route} />;
  }, [role, hasActiveAccess, isPending, isRejected, navigation, route]);
};

export default HomeRouter;
