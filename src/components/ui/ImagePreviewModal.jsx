// src/components/ui/ImagePreviewModal.jsx
// MODALE PREVIEW IMAGE - Correction dimensions absolues inter-plateformes
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';

const ImagePreviewModal = ({ visible, imageUrl, onClose }) => {
  const { width, height } = useWindowDimensions();

  if (!visible || !imageUrl) return null;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.fullScreenImageOverlay}>
        {/* Fond de secours au cas ou le BlurView n'est pas supporte par le GPU Android */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        
        <TouchableOpacity style={styles.closeImageBtn} onPress={onClose}>
          <Ionicons name="close-circle" size={40} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={[styles.imageContainer, { width, height }]}>
          <Image 
            source={{ uri: imageUrl }} 
            style={{ width: width * 0.95, height: height * 0.8 }} 
            resizeMode="contain" 
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenImageOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  closeImageBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  imageContainer: { justifyContent: 'center', alignItems: 'center' }
});

export default ImagePreviewModal;