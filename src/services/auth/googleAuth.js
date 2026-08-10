// src/services/auth/googleAuth.js
// SERVICE D'AUTHENTIFICATION GOOGLE NATIVE (SDK OFFICIEL - SAFE EXPO GO)
// STANDARD: Industriel / Bank Grade

import { NativeModules, Platform } from 'react-native';

export const GOOGLE_WEB_CLIENT_ID = '874118617681-i438m7c4ti48b584o6u00omffvckhphd.apps.googleusercontent.com';

let isConfigured = false;

// Helper de chargement dynamique ultra-sécurisé (Vérification NativeModules prioritaire)
const getGoogleSigninModule = () => {
  if (Platform.OS === 'web') return null;
  // Ne JAMAIS exécuter require() si le binaire natif RNGoogleSignin est absent (Expo Go)
  if (!NativeModules || !NativeModules.RNGoogleSignin) {
    return null;
  }
  try {
    return require('@react-native-google-signin/google-signin');
  } catch (err) {
    console.warn('[GoogleAuth] Impossible d\'importer @react-native-google-signin/google-signin:', err);
    return null;
  }
};

export const configureGoogleSignIn = () => {
  if (Platform.OS === 'web' || isConfigured) return;
  const sdk = getGoogleSigninModule();
  if (sdk && sdk.GoogleSignin) {
    try {
      sdk.GoogleSignin.configure({
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

  const sdk = getGoogleSigninModule();
  if (!sdk || !NativeModules.RNGoogleSignin) {
    throw new Error("L'authentification Google native requiert un Build de Développement ou APK (npx expo run:android). Elle n'est pas disponible dans l'application générique Expo Go.");
  }

  if (!isConfigured) {
    configureGoogleSignIn();
  }

  try {
    const { GoogleSignin, statusCodes } = sdk;
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
    const sdk = getGoogleSigninModule();
    const statusCodes = sdk?.statusCodes || {};
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
    const sdk = getGoogleSigninModule();
    if (sdk && sdk.GoogleSignin) {
      try {
        await sdk.GoogleSignin.signOut();
      } catch (err) {
        console.warn('[GoogleAuth] Erreur lors de la déconnexion Google:', err);
      }
    }
  }
};
