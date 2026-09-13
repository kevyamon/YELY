// src/screens/subscription/PaymentReturnScreen.jsx
// ECRAN DE RETOUR DE PAIEMENT PWA & REDIRECTION MOBILE (Motion 3D & Compte a rebours)
// STANDARD: Clean Architecture / Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import THEME from '../../theme/theme';

const paymentVideoSource = require('../../../assets/videos/paiement succed.mp4');

const PaymentReturnScreen = ({ route, navigation }) => {
  const [countdown, setCountdown] = useState(5);
  const [hasRedirected, setHasRedirected] = useState(false);

  const queryParams = typeof window !== 'undefined' && window.location?.search
    ? new URLSearchParams(window.location.search)
    : null;

  const reference = route?.params?.reference || queryParams?.get('reference') || '';
  const platform = route?.params?.platform || queryParams?.get('platform') || 'mobile';

  const deepLinkTarget = `yely://subscription?reference=${encodeURIComponent(reference)}&status=success`;
  const pwaFallbackTarget = `/subscription?reference=${encodeURIComponent(reference)}`;

  const handleOpenApp = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (platform === 'mobile') {
        window.location.href = deepLinkTarget;
      } else {
        if (navigation?.navigate) {
          navigation.navigate('Subscription', { reference });
        } else {
          window.location.href = pwaFallbackTarget;
        }
      }
    } else {
      if (navigation?.navigate) {
        navigation.navigate('Subscription', { reference });
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasRedirected) {
            setHasRedirected(true);
            handleOpenApp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasRedirected, handleOpenApp]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.videoWrapper}>
          {Platform.OS === 'web' ? (
            <video
              src={paymentVideoSource}
              autoPlay
              loop
              muted
              playsInline
              style={styles.webVideo}
            />
          ) : (
            <View style={styles.nativeFallbackIcon}>
              <Ionicons name="checkmark-circle" size={72} color={THEME.COLORS.champagneGold || '#D4AF37'} />
            </View>
          )}
        </View>

        <Text style={styles.title}>Paiement Validé</Text>
        <Text style={styles.subtitle}>
          Votre abonnement Yély est désormais actif et synchronisé en temps réel.
        </Text>

        <View style={styles.badgeCountdown}>
          <Ionicons name="time-outline" size={16} color={THEME.COLORS.champagneGold || '#D4AF37'} />
          <Text style={styles.countdownText}>
            {countdown > 0
              ? `Redirection automatique dans ${countdown}s...`
              : 'Redirection en cours...'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOpenApp}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Ouvrir Yély</Text>
          <Ionicons name="arrow-forward" size={18} color="#121418" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121418',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#1E222B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8
  },
  videoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  webVideo: {
    width: 140,
    height: 140,
    objectFit: 'cover',
    borderRadius: 70
  },
  nativeFallbackIcon: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.COLORS.champagneGold || '#D4AF37',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8
  },
  badgeCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 28,
    gap: 8
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.COLORS.champagneGold || '#D4AF37'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.champagneGold || '#D4AF37',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    gap: 10
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121418'
  }
});

export default PaymentReturnScreen;
