// src/components/ui/PwaIOSInstallGuide.web.jsx
// GUIDE D'INSTALLATION PWA IOS - Contournement Safari
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const PwaIOSInstallGuide = () => {
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|crmo/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIOS && isSafari && !isStandalone) {
      // Verifier si l'utilisateur n'a pas deja ferme le guide recemment
      const hideGuide = sessionStorage.getItem('hide_pwa_guide');
      if (!hideGuide) {
        setIsVisible(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        }).start();
      }
    }
  }, [slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 150,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      sessionStorage.setItem('hide_pwa_guide', 'true');
      setIsVisible(false);
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.bubble}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={18} color={THEME.COLORS.textSecondary} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Installer l'application Yely</Text>
        <Text style={styles.instruction}>
          Appuyez sur <Ionicons name="share-outline" size={16} color={THEME.COLORS.primary} /> au centre en bas de l'écran, puis sur <Text style={styles.bold}>"Sur l'écran d'accueil" ➕</Text>
        </Text>
      </View>
      <View style={styles.arrowDown} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 30, left: 20, right: 20, alignItems: 'center', zIndex: 9999 },
  bubble: { backgroundColor: THEME.COLORS.background, padding: 20, borderRadius: 16, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, borderWidth: 1, borderColor: THEME.COLORS.border },
  closeBtn: { position: 'absolute', top: 10, right: 10, padding: 5 },
  title: { fontSize: 16, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 8 },
  instruction: { fontSize: 14, color: THEME.COLORS.textSecondary, lineHeight: 22 },
  bold: { fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  arrowDown: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: THEME.COLORS.background, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 }
});

export default PwaIOSInstallGuide;