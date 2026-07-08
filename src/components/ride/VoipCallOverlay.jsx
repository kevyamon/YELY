import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  useColorScheme,
  StatusBar
} from 'react-native';

// Support universel (Native + Web PWA)
let RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices;

if (Platform.OS === 'web') {
  RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  RTCIceCandidate = window.RTCIceCandidate;
  RTCSessionDescription = window.RTCSessionDescription;
  mediaDevices = navigator.mediaDevices;
} else {
  const webrtc = require('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  mediaDevices = webrtc.mediaDevices;
}
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
import { showToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const RINGING_SOUND_URL = 'https://www.soundjay.com/phone/phone-ringing-01.mp3';
const CALLING_SOUND_URL = 'https://www.soundjay.com/phone/phone-calling-1.mp3';
const BEEP_SOUND_URL = 'https://www.soundjay.com/button/button-3.mp3';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ]
};

const VoipCallOverlay = () => {
  const dispatch = useDispatch();
  const callInfo = useSelector(selectCallInfo);
  const currentUser = useSelector(selectCurrentUser);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const themeColors = {
    gradient: isDarkMode ? ['#0E1116', '#1A1F2C'] : ['#F4F6FA', '#E4E9F2'],
    text: isDarkMode ? '#FFFFFF' : '#1C1C1E',
    subtext: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(28, 28, 30, 0.6)',
    cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    cardBorder: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    controlIcon: isDarkMode ? '#FFFFFF' : '#1C1C1E',
    avatarBg: isDarkMode ? '#1C1C1E' : '#FFFFFF',
    panelBg: isDarkMode ? 'rgba(20, 25, 35, 0.82)' : 'rgba(255, 255, 255, 0.85)',
    panelBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
  };

  const { callState, targetUserId, targetName, targetAvatar, targetPhone, isIncoming, callDuration } = callInfo;

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pulseScale = useSharedValue(1);

  // Queues de signalisation pour contrer les race conditions
  const pendingOfferRef = useRef(null);
  const pendingAnswerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const pcInitializedRef = useRef(false);

  const updateAudioRouting = async (speakerOn) => {
    if (Platform.OS === 'web') return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldRouteThroughEarpieceAndroid: !speakerOn,
        playThroughEarpieceAndroid: !speakerOn
      });
      console.log(`[VOIP CALL] Audio route updated: Speaker=${speakerOn}`);
    } catch (err) {
      console.warn('[VOIP CALL] Echec config audio mode:', err.message);
    }
  };

  const resetAudioMode = async () => {
    if (Platform.OS === 'web') return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldRouteThroughEarpieceAndroid: false,
        playThroughEarpieceAndroid: false
      });
      console.log('[VOIP CALL] Audio route reset to default');
    } catch (err) {
      console.warn('[VOIP CALL] Echec reset audio mode:', err.message);
    }
  };

  useEffect(() => {
    if (callState === 'connected') {
      updateAudioRouting(isSpeakerOn);
    } else if (callState === 'idle') {
      resetAudioMode();
    }
  }, [isSpeakerOn, callState]);

  // 1. Gestion des effets sonores avec expo-av
  const playSound = async (urlOrAsset, loop = false) => {
    try {
      await stopSound();
      const { sound } = await Audio.Sound.createAsync(
        urlOrAsset,
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
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    } catch (e) {}
  };

  // 2. Gestion de l'état d'appel et des transitions sonores
  useEffect(() => {
    if (callState === 'calling') {
      playSound({ uri: CALLING_SOUND_URL }, true);
    } else if (callState === 'ringing') {
      // Pour personnaliser l'audio localement, déposez votre fichier dans assets/sounds/call.wav et décommentez la ligne suivante :
      // playSound(require('../../assets/sounds/call.wav'), true);
      playSound({ uri: RINGING_SOUND_URL }, true);
    } else if (callState === 'connected') {
      playSound({ uri: BEEP_SOUND_URL }, false); // Beep de connexion
    } else {
      stopSound();
    }

    return () => {
      stopSound();
    };
  }, [callState]);

  // 3. Compteur de durée d'appel et WebRTC Cleanup
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

    if (callState === 'idle') {
      cleanupWebRTC();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState, dispatch]);

  const cleanupWebRTC = () => {
    pcInitializedRef.current = false;
    pendingOfferRef.current = null;
    pendingAnswerRef.current = null;
    pendingCandidatesRef.current = [];

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (Platform.OS === 'web') {
      const audio = document.getElementById('yely-remote-audio');
      if (audio) {
        audio.srcObject = null;
        audio.remove();
      }
    }
  };

  const startWebRTC = async () => {
    try {
      // Vérification des permissions avant d'instancier getUserMedia
      if (Platform.OS !== 'web') {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          dispatch(showToast({
            type: 'error',
            title: 'Accès micro requis',
            message: 'Yely a besoin du micro pour passer des appels vocaux.'
          }));
          handleHangup();
          return;
        }
      } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        dispatch(showToast({
          type: 'error',
          title: 'Sécurité Navigateur',
          message: 'L\'accès au micro nécessite une connexion HTTPS sécurisée.'
        }));
        handleHangup();
        return;
      }

      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      
      const pc = new RTCPeerConnection(configuration);
      pcRef.current = pc;
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Gestion et routage des pistes audio distantes
      pc.ontrack = (event) => {
        console.log("[WebRTC] Remote track received:", event.track.kind);
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          if (Platform.OS === 'web') {
            let audio = document.getElementById('yely-remote-audio');
            if (!audio) {
              audio = document.createElement('audio');
              audio.id = 'yely-remote-audio';
              audio.autoplay = true;
              document.body.appendChild(audio);
            }
            audio.srcObject = remoteStream;
            audio.play().catch(e => console.warn('[VOIP CALL] Echec lecture audio WebRTC:', e));
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.emit('webrtc_ice_candidate', {
            targetUserId,
            candidate: event.candidate
          });
        }
      };

      // PeerConnection initialisée et prête
      pcInitializedRef.current = true;

      // 1. Dépiler l'offre SDP en attente si reçue pendant le chargement (receveur)
      if (pendingOfferRef.current) {
        console.log("[WebRTC] Dépilage de l'offre SDP reçue en attente");
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.emit('webrtc_answer', {
          targetUserId,
          sdp: pc.localDescription
        });
        pendingOfferRef.current = null;
      } else if (!isIncoming) {
        // Émetteur : génère et envoie l'offre SDP initiale
        console.log("[WebRTC] Création de l'offre SDP locale");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit('webrtc_offer', {
          targetUserId,
          sdp: pc.localDescription
        });
      }

      // 2. Dépiler la réponse SDP en attente si reçue pendant le chargement (émetteur)
      if (pendingAnswerRef.current) {
        console.log("[WebRTC] Dépilage de la réponse SDP reçue en attente");
        await pc.setRemoteDescription(new RTCSessionDescription(pendingAnswerRef.current));
        pendingAnswerRef.current = null;
      }

      // 3. Dépiler les candidats ICE accumulés
      if (pendingCandidatesRef.current.length > 0) {
        console.log("[WebRTC] Dépilage de candidats ICE en attente:", pendingCandidatesRef.current.length);
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }

    } catch (err) {
      console.warn("[VOIP CALL] Echec WebRTC:", err);
      dispatch(showToast({
        type: 'error',
        title: 'Erreur Connexion',
        message: 'Impossible de se connecter au canal VoIP.'
      }));
      handleHangup();
    }
  };

  useEffect(() => {
    if (callState === 'calling' || callState === 'ringing') {
      startWebRTC();
    }
  }, [callState]);

  useEffect(() => {
    const handleOffer = async (data) => {
      if (data.callerId === targetUserId) {
        if (pcRef.current && pcInitializedRef.current) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socketService.emit('webrtc_answer', {
              targetUserId,
              sdp: pcRef.current.localDescription
            });
          } catch (err) {
            console.warn("[WebRTC] Echec traitement offre SDP:", err);
          }
        } else {
          console.log("[WebRTC] Offre SDP en attente d'initialisation du canal.");
          pendingOfferRef.current = data.sdp;
        }
      }
    };

    const handleAnswer = async (data) => {
      if (data.callerId === targetUserId) {
        if (pcRef.current && pcInitializedRef.current) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          } catch (err) {
            console.warn("[WebRTC] Echec traitement reponse SDP:", err);
          }
        } else {
          console.log("[WebRTC] Réponse SDP en attente d'initialisation du canal.");
          pendingAnswerRef.current = data.sdp;
        }
      }
    };

    const handleIceCandidate = async (data) => {
      if (data.callerId === targetUserId) {
        if (pcRef.current && pcInitializedRef.current) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.warn("[WebRTC] Echec ajout candidat ICE:", err);
          }
        } else {
          console.log("[WebRTC] Candidat ICE en attente.");
          pendingCandidatesRef.current.push(data.candidate);
        }
      }
    };

    socketService.on('webrtc_offer', handleOffer);
    socketService.on('webrtc_answer', handleAnswer);
    socketService.on('webrtc_ice_candidate', handleIceCandidate);

    return () => {
      socketService.off('webrtc_offer', handleOffer);
      socketService.off('webrtc_answer', handleAnswer);
      socketService.off('webrtc_ice_candidate', handleIceCandidate);
    };
  }, [targetUserId]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

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

  const pulseStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: withTiming(callState === 'connected' ? 0.3 : 0.6),
  }));

  const pulseStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (pulseScale.value - 1) * 2.2 }],
    opacity: withTiming(callState === 'connected' ? 0.15 : 0.3),
  }));

  const pulseStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (pulseScale.value - 1) * 3.4 }],
    opacity: withTiming(callState === 'connected' ? 0.05 : 0.12),
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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={themeColors.gradient} style={styles.container}>
        
        {targetAvatar && (
          <Image 
            source={{ uri: targetAvatar }} 
            style={StyleSheet.absoluteFillObject} 
            blurRadius={Platform.OS === 'ios' ? 40 : 25}
            opacity={0.12}
          />
        )}

        <View style={styles.backdrop}>
          
          {/* En-tête de l'appel */}
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={18} color={THEME.COLORS.champagneGold} />
            <Text style={styles.headerTitle}>Appel Vocal Sécurisé Yely</Text>
          </View>

          {/* Zone de l'avatar et du nom */}
          <View style={styles.avatarSection}>
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.avatarPulseRing, pulseStyle3]} />
              <Animated.View style={[styles.avatarPulseRing, pulseStyle2]} />
              <Animated.View style={[styles.avatarPulseRing, pulseStyle1]} />
              <View style={[styles.avatarContainer, { backgroundColor: themeColors.avatarBg }]}>
                {targetAvatar ? (
                  <Image source={{ uri: targetAvatar }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={60} color={THEME.COLORS.champagneGold} />
                )}
              </View>
            </View>

            <Text style={[styles.callerName, { color: themeColors.text }]}>{targetName || 'Correspondant'}</Text>
            <Text style={[styles.callerPhone, { color: themeColors.subtext }]}>Numéro : {targetPhone || 'Masqué'}</Text>
            
            <View style={styles.callStatusContainer}>
              <View style={[styles.statusDot, { backgroundColor: callState === 'connected' ? '#2ECC71' : '#F1C40F' }]} />
              <Text style={styles.callStatus}>
                {callState === 'calling' && 'Appel en cours...'}
                {callState === 'ringing' && 'Ça sonne...'}
                {callState === 'connected' && formatTime(callDuration)}
              </Text>
            </View>
          </View>

          {/* Zone des boutons d'actions - Floating Glass Panel */}
          <View style={[styles.floatingPanel, { backgroundColor: themeColors.panelBg, borderColor: themeColors.panelBorder }]}>
            
            {callState === 'ringing' && isIncoming ? (
              /* Mode Appel Entrant */
              <View style={styles.incomingButtonsRow}>
                <View style={styles.actionButtonWrapper}>
                  <TouchableOpacity style={[styles.circleButton, styles.declineButton]} onPress={handleDecline}>
                    <Ionicons name="close" size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={[styles.actionLabel, { color: themeColors.text }]}>Refuser</Text>
                </View>
                
                <View style={styles.actionButtonWrapper}>
                  <TouchableOpacity style={[styles.circleButton, styles.acceptButton]} onPress={handleAccept}>
                    <Ionicons name="call" size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={[styles.actionLabel, { color: themeColors.text }]}>Répondre</Text>
                </View>
              </View>
            ) : (
              /* Mode Appel Émis / Connecté */
              <View style={styles.callControlPanel}>
                <View style={styles.controlsRow}>
                  <View style={styles.controlButtonWrapper}>
                    <TouchableOpacity 
                      style={[styles.circleControl, isMuted ? styles.controlActive : { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]} 
                      onPress={() => setIsMuted(!isMuted)}
                    >
                      <Ionicons name={isMuted ? "mic-off" : "mic"} size={22} color={isMuted ? "#121418" : themeColors.controlIcon} />
                    </TouchableOpacity>
                    <Text style={[styles.controlLabel, { color: themeColors.subtext }]}>Silencieux</Text>
                  </View>

                  <View style={styles.controlButtonWrapper}>
                    <TouchableOpacity 
                      style={[styles.circleControl, isSpeakerOn ? styles.controlActive : { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]} 
                      onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                    >
                      <Ionicons name={isSpeakerOn ? "volume-high" : "volume-low"} size={22} color={isSpeakerOn ? "#121418" : themeColors.controlIcon} />
                    </TouchableOpacity>
                    <Text style={[styles.controlLabel, { color: themeColors.subtext }]}>Haut-parleur</Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.circleButton, styles.hangupButton]} onPress={handleHangup}>
                  <Ionicons name="call-outline" size={28} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: THEME.COLORS.champagneGold,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pulseContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarPulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  callerName: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  callerPhone: {
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  callStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  callStatus: {
    fontSize: 15,
    color: THEME.COLORS.champagneGold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  floatingPanel: {
    width: '90%',
    borderRadius: 30,
    borderWidth: 1.5,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 20,
  },
  incomingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
  },
  actionButtonWrapper: {
    alignItems: 'center',
    width: '40%',
  },
  circleButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  declineButton: {
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
  },
  acceptButton: {
    backgroundColor: '#2ECC71',
    shadowColor: '#2ECC71',
  },
  hangupButton: {
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: 'center',
    marginTop: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  callControlPanel: {
    alignItems: 'center',
    width: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 20,
  },
  controlButtonWrapper: {
    alignItems: 'center',
  },
  circleControl: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  controlActive: {
    backgroundColor: THEME.COLORS.champagneGold,
    borderColor: THEME.COLORS.champagneGold,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default VoipCallOverlay;
