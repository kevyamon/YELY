//src/components/ui/FacebookFollowModal.jsx
// MODALE INTELLIGENTE FACEBOOK - Tracking d'etat et de redirection
// STANDARD: Industriel / Bank Grade

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import ENV from '../../config/env';
import { useUpdateProfileMutation } from '../../store/api/usersApiSlice';
import { selectCurrentUser, selectIsAuthenticated, setCredentials } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';
import GlassModal from './GlassModal';
import GoldButton from './GoldButton';

const FacebookFollowModal = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const [updateProfile] = useUpdateProfileMutation();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState('invite'); // 'invite' | 'thank_you'
  const [waitingForReturn, setWaitingForReturn] = useState(false);
  
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Si l'utilisateur n'est pas connecte ou a deja suivi la page en base de donnees, on ne fait rien.
    if (!isAuthenticated || !user || user.hasFollowedFB) return;

    const checkEligibility = async () => {
      try {
        // Double verification locale au cas ou la session n'est pas a jour
        const localFollowFlag = await AsyncStorage.getItem(`FB_FOLLOWED_${user._id}`);
        if (localFollowFlag === 'true') return;

        const lastClosedStr = await AsyncStorage.getItem(`FB_MODAL_CLOSED_${user._id}`);
        if (lastClosedStr) {
          const lastClosedTime = parseInt(lastClosedStr, 10);
          const now = Date.now();
          const hours24 = 24 * 60 * 60 * 1000;
          
          // S'il a ferme la modale il y a moins de 24h, on n'affiche pas
          if (now - lastClosedTime < hours24) return;
        }

        // Delai pour ne pas brusquer l'UX au demarrage de l'app (laisser les autres alertes passer)
        setTimeout(() => setVisible(true), 3500);
      } catch (error) {
        console.error("Erreur lecture AsyncStorage FB Modal:", error);
      }
    };

    checkEligibility();
  }, [isAuthenticated, user]);

  // Ecouteur d'etat de l'application pour detecter le retour de Facebook
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (waitingForReturn) {
          setWaitingForReturn(false);
          setStep('thank_you');
          handleFollowSuccess();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [waitingForReturn]);

  const handleFollowSuccess = async () => {
    try {
      // 1. Validation locale definitive
      await AsyncStorage.setItem(`FB_FOLLOWED_${user._id}`, 'true');
      
      // 2. Mise a jour Backend
      const res = await updateProfile({ hasFollowedFB: true }).unwrap();
      
      // 3. Mise a jour du store Redux pour refleter le changement immediatement
      if (res.data) {
        dispatch(setCredentials({ user: res.data }));
      }
    } catch (error) {
      console.error("Erreur lors de la mise a jour du statut Facebook:", error);
    }
  };

  const handleSubscribeClick = async () => {
    const facebookUrl = ENV.FACEBOOK_LINK || 'https://facebook.com';
    try {
      setWaitingForReturn(true);
      await Linking.openURL(facebookUrl);
    } catch (error) {
      console.error("Erreur ouverture du lien Facebook:", error);
      // Fallback si le telephone refuse d'ouvrir le lien
      setWaitingForReturn(false);
    }
  };

  const handleClose = async () => {
    if (step === 'invite') {
      try {
        await AsyncStorage.setItem(`FB_MODAL_CLOSED_${user._id}`, Date.now().toString());
      } catch (e) {}
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <GlassModal
      visible={visible}
      onClose={handleClose}
      title={step === 'invite' ? "Rejoignez la communaute !" : "Merci !"}
      icon={step === 'invite' ? "logo-facebook" : "heart"}
    >
      <View style={styles.content}>
        {step === 'invite' ? (
          <>
            <Text style={styles.message}>
              Restez informe de toutes nos nouveautes, promotions et actualites en vous abonnant a la page officielle Yely.
            </Text>
            <GoldButton
              title="S'abonner a la page"
              icon="logo-facebook"
              onPress={handleSubscribeClick}
              style={styles.button}
            />
            <Text style={styles.cancelText} onPress={handleClose}>
              Plus tard
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.message}>
              Nous sommes ravis de vous compter parmi nos abonnes. Votre soutien nous aide a grandir !
            </Text>
            <GoldButton
              title="Fermer"
              icon="checkmark-outline"
              onPress={handleClose}
              style={styles.button}
            />
          </>
        )}
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: THEME.SPACING.sm,
  },
  message: {
    color: THEME.COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.SPACING.lg,
  },
  button: {
    width: '100%',
    marginBottom: THEME.SPACING.md,
  },
  cancelText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 14,
    textDecorationLine: 'underline',
    padding: THEME.SPACING.xs,
  }
});

export default FacebookFollowModal;