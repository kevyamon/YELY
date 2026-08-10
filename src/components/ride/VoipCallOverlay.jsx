import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { playSound } from '../../utils/soundHelper';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  useColorScheme,
  StatusBar
} from 'react-native';

// Support universel (Native + Web PWA + Compatibilité Expo Go)
let RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices;

if (Platform.OS === 'web') {
  RTCPeerConnection = typeof window !== 'undefined' ? (window.RTCPeerConnection || window.webkitRTCPeerConnection) : null;
  RTCIceCandidate = typeof window !== 'undefined' ? window.RTCIceCandidate : null;
  RTCSessionDescription = typeof window !== 'undefined' ? window.RTCSessionDescription : null;
  mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
} else {
  try {
    const webrtc = require('react-native-webrtc');
    if (webrtc && webrtc.RTCPeerConnection) {
      RTCPeerConnection = webrtc.RTCPeerConnection;
      RTCIceCandidate = webrtc.RTCIceCandidate;
      RTCSessionDescription = webrtc.RTCSessionDescription;
      mediaDevices = webrtc.mediaDevices;
    }
  } catch (e) {
    console.warn("[VoipCallOverlay] Module natif WebRTC non disponible dans le bac à sable Expo Go. Mode secours audio actif.");
  }
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
    gradient: isDarkMode ? ['#0A0C10', '#141824'] : ['#F8FAFC', '#E2E8F0'],
    text: isDarkMode ? '#FFFFFF' : '#0F172A',
    subtext: isDarkMode ? 'rgba(255, 255, 255, 0.72)' : 'rgba(15, 23, 42, 0.72)',
    cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
    cardBorder: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.12)',
    controlIcon: isDarkMode ? '#FFFFFF' : '#0F172A',
    avatarBg: isDarkMode ? '#1E293B' : '#FFFFFF',
    panelBg: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)',
    panelBorder: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
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

  // 1. Gestion des effets sonores avec soundHelper
  const triggerSound = async (type, loop = false) => {
    try {
      await stopSound();
      const controller = await playSound(type, loop);
      soundRef.current = controller;
    } catch (e) {
      console.warn('[VOIP CALL] Echec lecture son:', e.message);
    }
  };

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stop();
        soundRef.current = null;
      }
    } catch (e) {}
  };

  // 2. Gestion de l'état d'appel et des transitions sonores
  useEffect(() => {
    if (callState === 'calling') {
      triggerSound('calling', true);
    } else if (callState === 'ringing') {
      triggerSound('ringing', true);
    } else if (callState === 'connected') {
      triggerSound('beep', false); // Beep de connexion
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

  const handleDirectGsmCall = async () => {
    if (!targetPhone || targetPhone === 'Masqué') {
      dispatch(showToast({
        type: 'warning',
        title: 'Numéro indisponible',
        message: 'Le numéro de téléphone direct n\'est pas renseigné.'
      }));
      return;
    }
    try {
      const formattedPhone = targetPhone.replace(/\s+/g, '');
      const url = `tel:${formattedPhone}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        handleHangup();
        await Linking.openURL(url);
      } else {
        dispatch(showToast({
          type: 'error',
          title: 'Erreur Téléphonie',
          message: 'Impossible de composer le numéro depuis cet appareil.'
        }));
      }
    } catch (e) {
      console.warn('[VOIP CALL] Echec appel GSM direct:', e.message);
    }
  };

  const startWebRTC = async () => {
    try {
      let micGranted = false;

      if (Platform.OS !== 'web') {
        try {
          const currentStatus = await Audio.getPermissionsAsync();
          if (currentStatus.granted || currentStatus.status === 'granted') {
            micGranted = true;
          } else {
            const reqStatus = await Audio.requestPermissionsAsync();
            micGranted = reqStatus.granted || reqStatus.status === 'granted';
          }
        } catch (permErr) {
          console.warn("[VoipCallOverlay] Erreur vérification permission audio:", permErr.message);
          micGranted = false;
        }

        if (!micGranted) {
          dispatch(showToast({
            type: 'warning',
            title: 'Accès micro non accordé',
            message: 'Utilisez le bouton "Appel GSM" pour joindre directement le correspondant.'
          }));
          return;
        }
      } else {
        const hasGetUserMedia = navigator?.mediaDevices?.getUserMedia || 
                                navigator?.getUserMedia || 
                                navigator?.webkitGetUserMedia || 
                                navigator?.mozGetUserMedia;

        if (!hasGetUserMedia) {
          dispatch(showToast({
            type: 'warning',
            title: 'Navigateur Restreint',
            message: 'Veuillez utiliser un navigateur HTTPS ou le bouton "Appel GSM".'
          }));
          return;
        }
      }

      if (!mediaDevices || !mediaDevices.getUserMedia) {
        console.warn("[VoipCallOverlay] mediaDevices.getUserMedia non disponible dans ce contexte. Mode secours GSM prêt.");
        return;
      }

      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      
      if (!RTCPeerConnection) {
        console.warn("[VoipCallOverlay] RTCPeerConnection non initialisé.");
        return;
      }

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

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          if (pc.restartIce) {
            try { pc.restartIce(); } catch (e) {}
          }
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
      console.warn("[VOIP CALL] Echec WebRTC (Mode secours GSM disponible):", err.message);
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

                  <View style={styles.controlButtonWrapper}>
                    <TouchableOpacity 
                      style={[styles.circleControl, { backgroundColor: THEME.COLORS.champagneGold, borderColor: THEME.COLORS.champagneGold }]} 
                      onPress={handleDirectGsmCall}
                    >
                      <Ionicons name="call" size={22} color="#121418" />
                    </TouchableOpacity>
                    <Text style={[styles.controlLabel, { color: themeColors.subtext }]}>Appel GSM</Text>
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
