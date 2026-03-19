import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ADAPTATEUR STOCKAGE HYBRIDE (Tolerance aux pannes & Limite 2048 octets)
// - userInfo (potentiellement lourd) -> AsyncStorage (Sans limite de taille)
// - tokens (sensibles) -> SecureStore (Chiffre par l'OS)
// CSCSM Level: Bank Grade

const isWeb = Platform.OS === 'web';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getItemWithRetry = async (key, maxRetries = 3) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        // Echec apres tous les essais, on capitule mais on NE SUPPRIME PAS la cle.
        // Le Keystore est peut-etre juste temporairement indisponible a la sortie de veille.
        return null;
      }
      // Delai exponentiel pour laisser le Keystore se reveiller sans bloquer le thread principal
      await sleep(100 * Math.pow(2, attempt - 1));
    }
  }
  return null;
};

const SecureStorageAdapter = {
  getItem: async (key) => {
    try {
      if (isWeb || key === 'userInfo') {
        return await AsyncStorage.getItem(key);
      }
      return await getItemWithRetry(key);
    } catch (error) {
      // Securite globale : en cas d'erreur fatale non catchee plus haut, on retourne null
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      if (isWeb || key === 'userInfo') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      // Les erreurs d'ecriture ne doivent pas crasher l'application
    }
  },

  removeItem: async (key) => {
    try {
      if (isWeb || key === 'userInfo') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      // Les erreurs de suppression ne doivent pas crasher l'application
    }
  }
};

export default SecureStorageAdapter;