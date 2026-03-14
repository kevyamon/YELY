// src/components/help/HelpVideoModal.jsx
// COMPOSANT MODULAIRE - Modale d'aide interactive avec lecteur vidéo en streaming distant
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HELP_CATALOG } from '../../config/helpConfig';
import THEME from '../../theme/theme';
import GoldButton from '../ui/GoldButton';

const HelpVideoModal = ({ visible, onClose, role }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  const catalog = HELP_CATALOG[role === 'driver' ? 'driver' : 'rider'] || [];

  const player = useVideoPlayer(selectedVideo ? selectedVideo.videoSource : null, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.play();
  });

  useEffect(() => {
    if (!player) return;

    const statusSubscription = player.addListener('statusChange', (status) => {
      if (status === 'readyToPlay' && player.currentTime > 0 && player.currentTime >= player.duration) {
         setIsVideoFinished(true);
      }
    });

    const playToEndSubscription = player.addListener('playToEnd', () => {
      setIsVideoFinished(true);
    });

    return () => {
      statusSubscription.remove();
      playToEndSubscription.remove();
    };
  }, [player]);

  useEffect(() => {
    if (!visible) {
      setSelectedVideo(null);
      setIsVideoFinished(false);
      if (player) player.pause();
    }
  }, [visible, player]);

  const handleReplay = () => {
    if (player) {
      setIsVideoFinished(false);
      player.seekBy(-player.currentTime);
      player.play();
    }
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
    setIsVideoFinished(false);
    if (player) player.pause();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {selectedVideo ? selectedVideo.title : 'Centre d\'aide Yély'}
            </Text>
            <TouchableOpacity onPress={selectedVideo ? handleCloseVideo : onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {selectedVideo ? (
            <View style={styles.videoContainer}>
              <VideoView
                player={player}
                style={styles.videoPlayer}
                allowsFullscreen={true}
                allowsPictureInPicture={true}
                contentFit="contain"
              />
              
              {isVideoFinished && (
                <View style={styles.replayOverlay}>
                  <Text style={styles.finishedText}>Vidéo terminée</Text>
                  <GoldButton 
                    title="REVOIR LA VIDÉO" 
                    onPress={handleReplay} 
                    style={styles.replayBtn}
                  />
                </View>
              )}
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.subtitle}>
                Sélectionnez un tutoriel pour commencer :
              </Text>
              
              {catalog.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.card}
                  onPress={() => setSelectedVideo(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons name="play-circle" size={32} color={THEME.COLORS.primary} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={THEME.COLORS.border} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.COLORS.overlayDark,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: THEME.COLORS.background,
    borderTopLeftRadius: THEME.BORDERS.radius.xl,
    borderTopRightRadius: THEME.BORDERS.radius.xl,
    height: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    padding: 15,
    borderRadius: THEME.BORDERS.radius.lg,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  cardIcon: {
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  replayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  finishedText: {
    color: THEME.COLORS.pureWhite,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  replayBtn: {
    minWidth: 200,
  }
});

export default HelpVideoModal;