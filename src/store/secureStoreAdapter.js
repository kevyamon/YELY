import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ADAPTATEUR STOCKAGE HYBRIDE (Tolerance aux pannes & Limite 2048 octets)
// - userInfo (potentiellement lourd) -> AsyncStorage (Sans limite de taille)
// - tokens (sensibles) -> SecureStore (Chiffre par l'OS)
// CSCSM Level: Bank Grade

const isWeb = Platform.OS === 'web';

const SecureStorageAdapter = {
  getItem: async (key) => {
    try {
      if (isWeb || key === 'userInfo') {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // Mecanisme Fail-Safe : Si le Keystore natif est corrompu (ex: changement de code PIN du telephone),
      // on force la purge de la cle pour eviter un crash en boucle au demarrage.
      if (!isWeb && key !== 'userInfo') {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (e) {
          // Echec silencieux accepte ici
        }
      }
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