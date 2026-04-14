//src/components/ui/FacebookFollowModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import ENV from '../../config/env';
import { useUpdateUserProfileMutation } from '../../store/api/usersApiSlice';
import SecureStorageAdapter from '../../store/secureStoreAdapter';
import { selectCurrentUser, selectIsAuthenticated, setCredentials } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';
import GlassModal from './GlassModal';
import GoldButton from './GoldButton';

const FacebookFollowModal = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const [updateProfile] = useUpdateUserProfileMutation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState('invite'); 
  const [waitingForReturn, setWaitingForReturn] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated || !user || user.hasFollowedFB) return;
    const checkEligibility = async () => {
      try {
        const localFollowFlag = await SecureStorageAdapter.getItem(`FB_FOLLOWED_${user._id}`);
        if (localFollowFlag === 'true') return;
        const lastClosedStr = await SecureStorageAdapter.getItem(`FB_MODAL_CLOSED_${user._id}`);
        if (lastClosedStr) {
          const lastClosedTime = parseInt(lastClosedStr, 10);
          const hours24 = 24 * 60 * 60 * 1000;
          if (Date.now() - lastClosedTime < hours24) return;
        }
        setTimeout(() => setVisible(true), 5000);
      } catch (error) {
        console.warn("SecureStorage FB Modal Error:", error);
      }
    };
    checkEligibility();
  }, [isAuthenticated, user]);

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
    if (!user?._id) return;
    try {
      await SecureStorageAdapter.setItem(`FB_FOLLOWED_${user._id}`, 'true');
      const res = await updateProfile({ hasFollowedFB: true }).unwrap();
      if (res.data) {
        dispatch(setCredentials({ user: res.data }));
      }
    } catch (error) {
      console.warn("FB Status Update Error:", error);
    }
  };

  const handleSubscribeClick = async () => {
    const facebookUrl = ENV.FACEBOOK_LINK || 'https://facebook.com';
    try {
      setWaitingForReturn(true);
      await Linking.openURL(facebookUrl);
    } catch (error) {
      setWaitingForReturn(false);
    }
  };

  const handleClose = async () => {
    if (step === 'invite' && user?._id) {
      try {
        await SecureStorageAdapter.setItem(`FB_MODAL_CLOSED_${user._id}`, Date.now().toString());
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
            <GoldButton title="S'abonner a la page" icon="logo-facebook" onPress={handleSubscribeClick} style={styles.button} />
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Plus tard</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.message}>
              Nous sommes ravis de vous compter parmi nos abonnes. Votre soutien nous aide a grandir !
            </Text>
            <GoldButton title="Fermer" icon="checkmark-outline" onPress={handleClose} style={styles.button} />
          </>
        )}
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingVertical: THEME.SPACING.sm },
  message: { color: THEME.COLORS.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: THEME.SPACING.lg },
  button: { width: '100%', marginBottom: THEME.SPACING.md },
  cancelText: { color: THEME.COLORS.textTertiary, fontSize: 14, textDecorationLine: 'underline', padding: THEME.SPACING.xs }
});

export default FacebookFollowModal;