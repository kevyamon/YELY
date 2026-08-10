// src/services/auth/googleAuth.js
// SERVICE D'AUTHENTIFICATION GOOGLE NATIVE (SDK OFFICIEL)
// STANDARD: Industriel / Bank Grade

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export const GOOGLE_WEB_CLIENT_ID = '874118617681-i438m7c4ti48b584o6u00omffvckhphd.apps.googleusercontent.com';

let isConfigured = false;

export const configureGoogleSignIn = () => {
  if (Platform.OS !== 'web' && !isConfigured) {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
      isConfigured = true;
    } catch (err) {
      console.warn('[GoogleAuth] Erreur lors de la configuration du SDK Google:', err);
    }
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
    
    const idToken = response?.data?.idToken || response?.idToken;
    const user = response?.data?.user || response?.user;

    if (!idToken) {
      throw new Error("Aucun jeton ID renvoyé par le SDK Google Sign-In");
    }

    return {
      idToken,
      email: user?.email,
      name: user?.name || (user?.givenName ? `${user.givenName} ${user?.familyName || ''}` : ''),
      profilePicture: user?.photo
    };
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { cancelled: true };
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return { inProgress: true };
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services indisponibles ou obsolètes sur cet appareil.");
    }
    throw error;
  }
};

export const signOutGoogle = async () => {
  if (Platform.OS !== 'web' && isConfigured) {
    try {
      await GoogleSignin.signOut();
    } catch (err) {
      console.warn('[GoogleAuth] Erreur lors de la déconnexion Google:', err);
    }
  }
};
