// src/screens/SplashScreen.web.jsx
// SPLASH SCREEN PWA & WEB - Fond Jaune Officiel & Logo Centré Parfait
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis, 100% Web)

import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../theme/theme';

const splashCenterImg = require('../../assets/images/splash-center.png');

const SplashScreenWeb = ({ isServerReady, onFinish }) => {
  const [isFinishing, setIsFinishing] = useState(false);
  const [loadingText, setLoadingText] = useState('Démarrage de Yély...');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isServerReady) {
      setIsFinishing(true);
      setLoadingText('Système opérationnel');

      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 350);

      const finishTimer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 850);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [isServerReady, onFinish]);

  return (
    <View style={[styles.container, fadeOut && styles.containerFadeOut]}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative'
      }}>
        {/* Logo centré avec animation CSS douce */}
        <div style={{
          width: 240,
          height: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'yely-logo-pop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <Image
            source={splashCenterImg}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </div>

        {/* Barre de chargement fluide */}
        <div style={{
          position: 'absolute',
          bottom: 70,
          width: '55%',
          maxWidth: 280,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            width: '100%',
            height: 5,
            backgroundColor: 'rgba(18, 20, 24, 0.15)',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 10,
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: '#121418',
              borderRadius: 10,
              width: isFinishing ? '100%' : '40%',
              transition: isFinishing ? 'width 0.35s ease-in-out' : 'none',
              animation: isFinishing ? 'none' : 'yely-snake-web 1.4s infinite ease-in-out',
              position: 'absolute',
              left: isFinishing ? 0 : undefined
            }} />
          </div>
          <Text style={styles.progressText}>{loadingText}</Text>
        </div>
      </div>

      <style>{`
        @keyframes yely-logo-pop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes yely-snake-web {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 99999,
    backgroundColor: '#D4AF37',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'opacity 0.5s ease, transform 0.5s ease',
    opacity: 1,
  },
  containerFadeOut: {
    opacity: 0,
    pointerEvents: 'none',
    transform: 'scale(1.04)',
  },
  splashImage: {
    width: 240,
    height: 240,
    maxWidth: '75vw',
    maxHeight: '75vw',
  },
  progressText: {
    color: '#121418',
    fontSize: FONTS.sizes.bodySmall || 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default React.memo(SplashScreenWeb);
