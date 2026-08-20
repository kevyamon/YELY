// src/services/auth/googleAuth.js
// SERVICE D'AUTHENTIFICATION GOOGLE NATIVE
// STANDARD: Industriel / Bank Grade
// Compatible: @react-native-google-signin/google-signin v16.x

import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// =============================================================================
// CONSTANTES
// =============================================================================

export const GOOGLE_WEB_CLIENT_ID = '874118617681-k2lm3s264crj6910cqhd4e4ehqa6g6mc.apps.googleusercontent.com';

// =============================================================================
// AUTHENTIFICATION PRINCIPALE
// Compatible v16 : l'ordre OBLIGATOIRE est hasPlayServices → configure → signIn
// =============================================================================

export const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    throw new Error('PLATFORM_WEB_GSI');
  }

  // ÉTAPE 1 — Vérifier la disponibilité de Google Play Services
  // Doit être appelé EN PREMIER, avant configure(), selon l'API v16
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // ÉTAPE 2 — Configurer le SDK (réentrant, idempotent)
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  try {
    // ÉTAPE 3 — Lancer le sélecteur de compte natif Android
    const response = await GoogleSignin.signIn();

    // Support universel v13→v16 : l'idToken peut être dans response.data ou à la racine
    const idToken =
      response?.data?.idToken ||
      response?.idToken ||
      response?.data?.id_token ||
      response?.id_token;

    const userObj = response?.data?.user || response?.user;

    const email =
      userObj?.email ||
      response?.data?.email;

    const name =
      userObj?.name ||
      (userObj?.givenName
        ? `${userObj.givenName} ${userObj?.familyName || ''}`.trim()
        : null) ||
      response?.data?.name;

    const profilePicture = userObj?.photo || response?.data?.photo;

    if (!idToken && !email) {
      throw new Error('Aucune donnée utilisateur renvoyée par Google.');
    }

    return { idToken, email, name, profilePicture };

  } catch (error) {
    // Annulation volontaire par l'utilisateur
    if (
      error.code === statusCodes.SIGN_IN_CANCELLED ||
      error.code === '12501'
    ) {
      return { cancelled: true };
    }

    // Une connexion est déjà en cours (double-tap)
    if (error.code === statusCodes.IN_PROGRESS) {
      return { inProgress: true };
    }

    // Google Play Services manquants ou obsolètes
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error(
        'Google Play Services indisponibles ou obsolètes sur cet appareil.',
      );
    }

    // Toute autre erreur (DEVELOPER_ERROR, réseau, etc.)
    console.error('[GoogleAuth] Erreur signIn:', {
      code: error.code,
      message: error.message,
    });
    throw new Error(
      error?.message || 'Impossible de finaliser la connexion Google.',
    );
  }
};

// =============================================================================
// DÉCONNEXION
// =============================================================================

export const signOutGoogle = async () => {
  if (Platform.OS !== 'web') {
    try {
      await GoogleSignin.signOut();
    } catch (err) {
      console.warn('[GoogleAuth] Erreur déconnexion:', err);
    }
  }
};

// =============================================================================
// COMPAT — configureGoogleSignIn conservé pour éviter de casser LoginPage.jsx
// Le configure() réel est maintenant fait dans signInWithGoogle() au bon moment.
// =============================================================================

export const configureGoogleSignIn = () => {
  // No-op intentionnel : la configuration se fait juste avant signIn()
  // pour respecter l'ordre exigé par @react-native-google-signin v16.
};
