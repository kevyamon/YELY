import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🛡️ ADAPTATEUR STOCKAGE SÉCURISÉ
// Sur mobile, on utilise le Keychain/Keystore via SecureStore.
// Sur web, SecureStore n'est pas dispo, on fallback sur AsyncStorage (moins sécurisé mais inévitable sur web).

const isWeb = Platform.OS === 'web';

const SecureStorageAdapter = {
  getItem: async (key) => {
    try {
      if (isWeb) {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('[SecureStorage] Get Error:', error);
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      if (isWeb) {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('[SecureStorage] Set Error:', error);
    }
  },

  removeItem: async (key) => {
    try {
      if (isWeb) {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('[SecureStorage] Remove Error:', error);
    }
  }
};

export default SecureStorageAdapter;
