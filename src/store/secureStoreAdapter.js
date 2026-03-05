import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ADAPTATEUR STOCKAGE HYBRIDE (Tolérance aux pannes & Limite 2048 octets)
// - userInfo (potentiellement lourd) -> AsyncStorage (Sans limite de taille)
// - tokens (sensibles) -> SecureStore (Chiffré par l'OS)
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
      console.error(`[SecureStorage] Erreur lecture pour ${key}:`, error);
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
      console.error(`[SecureStorage] Erreur ecriture pour ${key}:`, error);
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
      console.error(`[SecureStorage] Erreur suppression pour ${key}:`, error);
    }
  }
};

export default SecureStorageAdapter;