import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../../services/socketService';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { endCall, acceptCall, selectCallInfo, updateDuration } from '../../store/slices/callSlice';
import THEME from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const RINGING_SOUND_URL = 'https://www.soundjay.com/phone/phone-ringing-01.mp3';
const CALLING_SOUND_URL = 'https://www.soundjay.com/phone/phone-calling-1.mp3';
const BEEP_SOUND_URL = 'https://www.soundjay.com/button/button-3.mp3';

const VoipCallOverlay = () => {
  const dispatch = useDispatch();
  const callInfo = useSelector(selectCallInfo);
  const currentUser = useSelector(selectCurrentUser);

  const { callState, targetUserId, targetName, targetAvatar, targetPhone, isIncoming, callDuration } = callInfo;

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const pulseScale = useSharedValue(1);

  // 1. Gestion des effets sonores avec expo-av
  const playSound = async (url, loop = false) => {
    try {
      await stopSound();
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, isLooping: loop }
      );
      soundRef.current = sound;
    } catch (e) {
      console.warn('[VOIP CALL] Echec lecture son:', e.message);
    }
  };

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {}
  };

  // 2. Gestion de l'état d'appel et des transitions sonores
  useEffect(() => {
    if (callState === 'calling') {
      playSound(CALLING_SOUND_URL, true);
    } else if (callState === 'ringing') {
      playSound(RINGING_SOUND_URL, true);
    } else if (callState === 'connected') {
      playSound(BEEP_SOUND_URL, false); // Beep de connexion
    } else {
      stopSound();
    }

    return () => {
      stopSound();
    };
  }, [callState]);

  // 3. Compteur de durée d'appel
  useEffect(() => {
    if (callState === 'connected') {
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        dispatch(updateDuration(elapsed));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState, dispatch]);

  // 4. Animation de pulsation autour de l'avatar
  useEffect(() => {
    if (callState === 'calling' || callState === 'ringing') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else if (callState === 'connected') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [callState, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Actions
  const handleHangup = () => {
    if (targetUserId) {
      socketService.emit('voice_call_hangup', { targetUserId });
    }
    dispatch(endCall());
  };

  const handleDecline = () => {
    if (targetUserId) {
      socketService.emit('voice_call_decline', { callerId: targetUserId });
    }
    dispatch(endCall());
  };

  const handleAccept = () => {
    if (targetUserId) {
      socketService.emit('voice_call_accept', { callerId: targetUserId });
    }
    dispatch(acceptCall());
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  if (callState === 'idle') return null;

  return (
    <Modal visible={callState !== 'idle'} transparent={true} animationType="slide">
      <View style={styles.backdrop}>
        
        {/* En-tête de l'appel */}
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={20} color={THEME.COLORS.champagneGold} />
          <Text style={styles.headerTitle}>Appel Vocal Sécurisé Yely</Text>
        </View>

        {/* Zone de l'avatar et du nom */}
        <View style={styles.avatarSection}>
          <Animated.View style={[styles.avatarPulseWrapper, pulseStyle]}>
            <View style={styles.avatarContainer}>
              {targetAvatar ? (
                <Image source={{ uri: targetAvatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={70} color={THEME.COLORS.champagneGold} />
              )}
            </View>
          </Animated.View>

          <Text style={styles.callerName}>{targetName || 'Correspondant'}</Text>
          <Text style={styles.callerPhone}>Numéro : {targetPhone || 'Masqué'}</Text>
          
          <Text style={styles.callStatus}>
            {callState === 'calling' && 'Appel en cours...'}
            {callState === 'ringing' && 'Ça sonne...'}
            {callState === 'connected' && formatTime(callDuration)}
          </Text>
        </View>

        {/* Zone des boutons d'actions */}
        <View style={styles.actionsContainer}>
          
          {callState === 'ringing' && isIncoming ? (
            /* Mode Appel Entrant */
            <View style={styles.incomingButtonsRow}>
              <TouchableOpacity style={[styles.circleButton, styles.declineButton]} onPress={handleDecline}>
                <Ionicons name="close" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Refuser</Text>
              
              <TouchableOpacity style={[styles.circleButton, styles.acceptButton]} onPress={handleAccept}>
                <Ionicons name="call" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Répondre</Text>
            </View>
          ) : (
            /* Mode Appel Émis / Connecté */
            <View style={styles.callControlPanel}>
              <View style={styles.controlsRow}>
                <TouchableOpacity 
                  style={[styles.circleControl, isMuted && styles.controlActive]} 
                  onPress={() => setIsMuted(!isMuted)}
                >
                  <Ionicons name={isMuted ? "mic-off" : "mic"} size={22} color={isMuted ? "#121418" : "#FFFFFF"} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.circleControl, isSpeakerOn && styles.controlActive]} 
                  onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                >
                  <Ionicons name={isSpeakerOn ? "volume-high" : "volume-low"} size={22} color={isSpeakerOn ? "#121418" : "#FFFFFF"} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.circleButton, styles.hangupButton]} onPress={handleHangup}>
                <Ionicons name="call-outline" size={32} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#0E1116', // Fond sombre immersif
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: THEME.COLORS.champagneGold,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPulseWrapper: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: THEME.COLORS.glassDark,
    borderWidth: 4,
    borderColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  callerName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  callerPhone: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary,
    marginBottom: 20,
    fontWeight: '600',
  },
  callStatus: {
    fontSize: 18,
    color: THEME.COLORS.champagneGold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  incomingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
  },
  circleButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  declineButton: {
    backgroundColor: THEME.COLORS.danger || '#E74C3C',
  },
  acceptButton: {
    backgroundColor: THEME.COLORS.success || '#2ECC71',
  },
  hangupButton: {
    backgroundColor: THEME.COLORS.danger || '#E74C3C',
    alignSelf: 'center',
    marginTop: 20,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  callControlPanel: {
    alignItems: 'center',
    width: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 20,
  },
  circleControl: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlActive: {
    backgroundColor: THEME.COLORS.champagneGold,
    borderColor: THEME.COLORS.champagneGold,
  },
});

export default VoipCallOverlay;
