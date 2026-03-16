// src/components/ui/PwaIOSInstallGuide.web.jsx
// GUIDE D'INSTALLATION PWA IOS - Contournement Safari
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const PwaIOSInstallGuide = () => {
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|crmo/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIOS && isSafari && !isStandalone) {
      const hideGuide = sessionStorage.getItem('hide_pwa_guide');
      if (!hideGuide) {
        setIsVisible(true);
        // Remplacement du Spring lent par un Timing instantané et fluide
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
          })
        ]).start();
      }
    }
  }, [slideAnim, opacityAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      })
    ]).start(() => {
      sessionStorage.setItem('hide_pwa_guide', 'true');
      setIsVisible(false);
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <View style={styles.bubble}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={20} color={THEME.COLORS.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Ionicons name="download-outline" size={24} color={THEME.COLORS.primary} style={styles.headerIcon} />
          <Text style={styles.title}>Installer l'application Yely</Text>
        </View>
        
        <Text style={styles.instruction}>
          Appuyez sur l'icone de partage <Ionicons name="share-outline" size={18} color={THEME.COLORS.primary} /> dans la barre de navigation Safari, puis selectionnez <Text style={styles.bold}>"Sur l'ecran d'accueil"</Text>.
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { 
    position: 'absolute', 
    bottom: 40, 
    left: 20, 
    right: 20, 
    alignItems: 'center', 
    zIndex: 9999 
  },
  bubble: { 
    backgroundColor: THEME.COLORS.background, 
    padding: 20, 
    borderRadius: 16, 
    width: '100%', 
    borderWidth: 1, 
    borderColor: THEME.COLORS.border,
    shadowColor: THEME.COLORS.shadow || '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10
  },
  closeBtn: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    padding: 8,
    zIndex: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 30
  },
  headerIcon: {
    marginRight: 8
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: THEME.COLORS.textPrimary 
  },
  instruction: { 
    fontSize: 14, 
    color: THEME.COLORS.textSecondary, 
    lineHeight: 22 
  },
  bold: { 
    fontWeight: 'bold', 
    color: THEME.COLORS.textPrimary 
  }
});

export default PwaIOSInstallGuide;