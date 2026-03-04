// src/components/ui/ImagePreviewModal.jsx
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const ImagePreviewModal = ({ visible, imageUrl, onClose }) => {
  if (!visible || !imageUrl) return null;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.fullScreenImageOverlay}>
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        
        <TouchableOpacity style={styles.closeImageBtn} onPress={onClose}>
          <Ionicons name="close-circle" size={36} color="#FFF" />
        </TouchableOpacity>
        
        <ScrollView 
          contentContainerStyle={styles.fullScreenImageScroll}
          maximumZoomScale={3} // On garde le zoom pour lire les petits textes !
          minimumZoomScale={1}
          centerContent={true}
        >
          <Image source={{ uri: imageUrl }} style={styles.fullScreenImage} resizeMode="contain" />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenImageOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  closeImageBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  fullScreenImageScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  fullScreenImage: { width: '100%', height: '80%' }
});

export default ImagePreviewModal;