// src/utils/soundHelper.js
import { Platform } from 'react-native';

let expoAudio = null;
if (Platform.OS !== 'web') {
  try {
    expoAudio = require('expo-av').Audio;
  } catch (err) {
    console.warn('[SoundHelper] expo-av not loaded on native', err);
  }
}

// URLs pour les alertes audio (fallbacks sécurisés)
const SOUND_URLS = {
  new_ride: 'https://www.soundjay.com/phone/phone-ringing-01.mp3',
  new_order: 'https://www.soundjay.com/button/button-3.mp3',
  calling: 'https://www.soundjay.com/phone/phone-ringing-03.mp3',
  ringing: 'https://www.soundjay.com/phone/phone-ringing-01.mp3',
  beep: 'https://www.soundjay.com/button/button-9.mp3',
};

let isUnlocked = false;
const webAudioElements = {};

/**
 * Déverrouille les flux audio sur les navigateurs web (PWA)
 * Suite aux politiques d'autoplay strictes des navigateurs, l'audio ne peut se lancer
 * qu'après un premier geste de l'utilisateur (click, touch).
 */
export const unlockWebAudio = () => {
  if (Platform.OS !== 'web' || isUnlocked) return;

  const unlock = () => {
    Object.keys(SOUND_URLS).forEach(key => {
      try {
        const audio = new window.Audio(SOUND_URLS[key]);
        audio.volume = 0;
        // Lance une lecture silencieuse puis met en pause immédiatement
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1;
            webAudioElements[key] = audio;
          }).catch(err => {
            console.log('[SoundHelper] Autoplay unlock promise rejected:', err.message);
          });
        }
      } catch (e) {
        console.warn('[SoundHelper] Fail preview unlock for', key, e.message);
      }
    });

    isUnlocked = true;
    window.removeEventListener('click', unlock);
    window.removeEventListener('touchstart', unlock);
    console.info('[SoundHelper] Web Audio unlocked via interaction.');
  };

  window.addEventListener('click', unlock);
  window.addEventListener('touchstart', unlock);
};

/**
 * Lance la lecture d'une sonnerie ou alerte audio
 * @param {string} type Nom du son à lancer ('new_ride', 'new_order', 'calling', 'ringing', 'beep')
 * @param {boolean} loop Indique si la lecture doit boucler (par défaut false)
 * @returns {object|null} Un controlleur { stop: () => void } pour arrêter le son
 */
export const playSound = async (type, loop = false) => {
  const url = SOUND_URLS[type];
  if (!url) return null;

  if (Platform.OS === 'web') {
    try {
      let audio = webAudioElements[type];
      if (!audio) {
        audio = new window.Audio(url);
        webAudioElements[type] = audio;
      }
      audio.loop = loop;
      audio.currentTime = 0;
      audio.volume = 1;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      return {
        stop: () => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch (err) {}
        }
      };
    } catch (e) {
      console.warn('[SoundHelper] Echec lecture audio web:', e.message);
      // Fallback direct sur nouvel objet HTML Audio si déverrouillage préalable absent
      try {
        const fallbackAudio = new window.Audio(url);
        fallbackAudio.loop = loop;
        fallbackAudio.play().catch(() => {});
        return {
          stop: () => {
            try {
              fallbackAudio.pause();
              fallbackAudio.currentTime = 0;
            } catch (err) {}
          }
        };
      } catch (err) {}
      return null;
    }
  } else {
    // Native Mobile (Expo-av)
    try {
      if (!expoAudio) return null;
      await expoAudio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldRouteThroughEarpieceAndroid: false
      }).catch(() => {});

      const { sound } = await expoAudio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, isLooping: loop }
      );

      return {
        stop: async () => {
          try {
            await sound.stopAsync().catch(() => {});
            await sound.unloadAsync().catch(() => {});
          } catch (err) {}
        }
      };
    } catch (e) {
      console.warn('[SoundHelper] Echec lecture audio natif:', e.message);
      return null;
    }
  }
};
