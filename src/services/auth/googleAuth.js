// src/services/auth/googleAuth.js
// SERVICE D'AUTHENTIFICATION GOOGLE NATIVE
// STANDARD: Industriel / Bank Grade

import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export const GOOGLE_WEB_CLIENT_ID = '874118617681-k2lm3s264crj6910cqhd4e4ehqa6g6mc.apps.googleusercontent.com';

let isConfigured = false;

export const configureGoogleSignIn = () => {
  if (Platform.OS === 'web' || isConfigured) return;
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
    isConfigured = true;
  } catch (err) {
    console.warn('[GoogleAuth] Erreur configuration:', err);
  }
};

export const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    throw new Error('PLATFORM_WEB_GSI');
  }

  if (!isConfigured) {
    configureGoogleSignIn();
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    
    // Support universel @react-native-google-signin v10 à v16
    const idToken = response?.data?.idToken || response?.idToken || response?.data?.id_token || response?.id_token;
    const user = response?.data?.user || response?.user;

    const email = user?.email || response?.data?.email;
    const name = user?.name || (user?.givenName ? `${user.givenName} ${user?.familyName || ''}` : '') || response?.data?.name;
    const profilePicture = user?.photo || response?.data?.photo;

    if (!idToken && !email) {
      throw new Error("Aucune donnée utilisateur renvoyée par Google.");
    }

    return {
      idToken,
      email,
      name,
      profilePicture
    };
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === '12501') {
      return { cancelled: true };
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return { inProgress: true };
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services indisponibles ou obsolètes sur cet appareil.");
    }

    console.error('[GoogleAuth Error]', error);
    throw new Error(error?.message || "Impossible de finaliser la connexion Google.");
  }
};

export const signOutGoogle = async () => {
  if (Platform.OS !== 'web') {
    try {
      await GoogleSignin.signOut();
    } catch (err) {
      console.warn('[GoogleAuth] Erreur déconnexion:', err);
    }
  }
};
