// src/services/auth/googleAuth.js
// SERVICE D'AUTHENTIFICATION GOOGLE NATIVE & SECOURS UNIVERSEL
// STANDARD: Industriel / Bank Grade

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { NativeModules, Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_WEB_CLIENT_ID = '874118617681-k2lm3s264crj6910cqhd4e4ehqa6g6mc.apps.googleusercontent.com';

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
        scopes: ['email', 'profile'],
      });
      isConfigured = true;
    } catch (err) {
      console.warn('[GoogleAuth] Erreur lors de la configuration du SDK Google:', err);
    }
  }
};

const signInWithGoogleBrowserFallback = async () => {
  try {
    const redirectUri = Linking.createURL('oauth-callback');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_WEB_CLIENT_ID}&response_type=token&scope=email%20profile%20openid&prompt=select_account&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    
    if (result.type === 'success' && result.url) {
      const urlStr = result.url;
      const hashIndex = urlStr.indexOf('#');
      const queryIndex = urlStr.indexOf('?');
      const rawParams = hashIndex !== -1 
        ? urlStr.substring(hashIndex + 1) 
        : (queryIndex !== -1 ? urlStr.substring(queryIndex + 1) : '');
        
      const params = new URLSearchParams(rawParams);
      const accessToken = params.get('access_token');

      if (accessToken) {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userInfo = await userInfoRes.json();
        return {
          email: userInfo.email,
          name: userInfo.name || (userInfo.given_name ? `${userInfo.given_name} ${userInfo.family_name || ''}` : ''),
          profilePicture: userInfo.picture
        };
      }
    }
    return { cancelled: true };
  } catch (browserErr) {
    throw new Error("L'authentification Google a échoué. Veuillez réessayer.");
  }
};

export const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    throw new Error('PLATFORM_WEB_GSI');
  }

  const sdk = getGoogleSigninModule();

  // SECOURS EXPO GO : Redirection WebBrowser avec Linking.createURL (Dépendance native valide)
  if (!sdk || !NativeModules.RNGoogleSignin) {
    return signInWithGoogleBrowserFallback();
  }

  if (!isConfigured) {
    configureGoogleSignIn();
  }

  try {
    const { GoogleSignin } = sdk;
    // Déconnexion préventive pour forcer l'affichage de la modale de choix de compte
    await GoogleSignin.signOut().catch(() => {});
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    
    const idToken = response?.data?.idToken || response?.idToken || response?.data?.id_token || response?.id_token;
    const user = response?.data?.user || response?.user;

    const email = user?.email || response?.data?.email;
    const name = user?.name || (user?.givenName ? `${user.givenName} ${user?.familyName || ''}` : '') || response?.data?.name;
    const profilePicture = user?.photo || response?.data?.photo;

    if (!idToken && !email) {
      throw new Error("Aucune donnée utilisateur renvoyée par la connexion Google.");
    }

    return {
      idToken,
      email,
      name,
      profilePicture
    };
  } catch (error) {
    const sdk = getGoogleSigninModule();
    const statusCodes = sdk?.statusCodes || {};

    const isDeveloperError = 
      error.code === '10' || 
      error.code === 10 || 
      (error.message && error.message.includes('DEVELOPER_ERROR')) ||
      (error.code && error.code.toString() === '10');

    // Fallback automatique si erreur de configuration développeur détectée
    if (isDeveloperError) {
      console.warn('[GoogleAuth] DEVELOPER_ERROR détecté. Bascule vers le fallback WebBrowser...');
      return signInWithGoogleBrowserFallback();
    }

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
