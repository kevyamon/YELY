// src/components/marketplace/MarketplaceBanner.jsx
// COMPOSANT BANNIÈRE PROMO LIVE - Diaporama Interactif Temps Réel
// STANDARD: Industriel (Zéro dépendance lourde, 60 FPS Anim, Multi-plateforme)

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  Platform,
  Easing
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetBannersQuery } from '../../store/api/marketplaceApiSlice';
import THEME from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// 🧼 ANIMATION 1 : BULLES MONTANTES (BUBBLES)
// ==========================================
const RisingBubbles = () => {
  const bubbleCount = 6;
  const anims = useRef([...Array(bubbleCount)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const startAnimation = (index) => {
      anims[index].setValue(0);
      Animated.timing(anims[index], {
        toValue: 1,
        duration: 3000 + Math.random() * 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => startAnimation(index));
    };

    anims.forEach((_, i) => {
      // Démarrage décalé
      const timeout = setTimeout(() => startAnimation(i), i * 600);
      return () => clearTimeout(timeout);
    });
  }, [anims]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((anim, i) => {
        const left = 10 + i * 16 + Math.random() * 8; // Répartition horizontale
        const scale = anim.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0.3, 1, 1, 0]
        });
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [160, -20]
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 0.6, 0.6, 0]
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.bubble,
              {
                left: `${left}%`,
                transform: [{ translateY }, { scale }],
                opacity,
              }
            ]}
          />
        );
      })}
    </View>
  );
};

// ==========================================
// 🧼 ANIMATION 2 : PLUIE DE CONFETTIS (CONFETTI)
// ==========================================
const FallingConfetti = () => {
  const confettiCount = 10;
  const anims = useRef([...Array(confettiCount)].map(() => new Animated.Value(0))).current;
  const colors = ['#F1C40F', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#E67E22'];

  useEffect(() => {
    const startAnimation = (index) => {
      anims[index].setValue(0);
      Animated.timing(anims[index], {
        toValue: 1,
        duration: 2500 + Math.random() * 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startAnimation(index));
    };

    anims.forEach((_, i) => {
      const timeout = setTimeout(() => startAnimation(i), i * 400);
      return () => clearTimeout(timeout);
    });
  }, [anims]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((anim, i) => {
        const left = 5 + i * 9 + Math.random() * 5;
        const color = colors[i % colors.length];
        
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 180]
        });
        const translateX = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 15, -15]
        });
        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 1, 1, 0]
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.confetto,
              {
                left: `${left}%`,
                backgroundColor: color,
                transform: [{ translateY }, { translateX }, { rotate }],
                opacity,
              }
            ]}
          />
        );
      })}
    </View>
  );
};

// ==========================================
// 🧼 ANIMATION 3 : ÉTOILES SCINTILLANTES (STARS)
// ==========================================
const TwinklingStars = () => {
  const starCount = 6;
  const anims = useRef([...Array(starCount)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const startAnimation = (index) => {
      anims[index].setValue(0);
      Animated.sequence([
        Animated.timing(anims[index], {
          toValue: 1,
          duration: 1000 + Math.random() * 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anims[index], {
          toValue: 0,
          duration: 1000 + Math.random() * 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        })
      ]).start(() => startAnimation(index));
    };

    anims.forEach((_, i) => {
      const timeout = setTimeout(() => startAnimation(i), i * 350);
      return () => clearTimeout(timeout);
    });
  }, [anims]);

  // Positions prédéfinies bien réparties
  const positions = [
    { top: '15%', left: '45%' },
    { top: '65%', left: '15%' },
    { top: '75%', left: '80%' },
    { top: '25%', left: '75%' },
    { top: '50%', left: '50%' },
    { top: '10%', left: '10%' }
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((anim, i) => {
        const scale = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.4, 1.2, 0.4]
        });
        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '90deg']
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.starWrapper,
              positions[i],
              {
                transform: [{ scale }, { rotate }],
                opacity: anim,
              }
            ]}
          >
            <MaterialCommunityIcons name="star-four-points" size={16} color={THEME.COLORS.primary} />
          </Animated.View>
        );
      })}
    </View>
  );
};

// ==========================================
// 🚀 COMPOSANT PRINCIPAL DE LA BANNIÈRE CARROUSEL
// ==========================================
const MarketplaceBanner = ({ navigation }) => {
  const { data: response, isLoading } = useGetBannersQuery();
  const slides = response?.data || response || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Valeurs d'animations de transition
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideXAnim = useRef(new Animated.Value(0)).current;

  // Lance l'intervalle de défilement de 6.5s
  useEffect(() => {
    if (slides.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      // Transition fluide de sortie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true
        }),
        Animated.timing(slideXAnim, {
          toValue: -30,
          duration: 350,
          useNativeDriver: true
        })
      ]).start(() => {
        // Changement d'index diapo
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        
        // Repositionnement direct avant ré-apparition
        slideXAnim.setValue(30);
        
        // Transition fluide d'entrée
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(slideXAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          })
        ]).start();
      });
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused, fadeAnim, slideXAnim]);

  // Si chargement ou aucune diapositive disponible
  if (isLoading || slides.length === 0) {
    return null;
  }

  const activeSlide = slides[currentIndex];

  // Pause tactile/hover
  const handlePressIn = () => {
    setIsPaused(true);
  };

  const handlePressOut = () => {
    setIsPaused(false);
  };

  // Rendu de l'animation associée au slide
  const renderMicroAnimation = () => {
    switch (activeSlide.animationType) {
      case 'bubbles':
        return <RisingBubbles />;
      case 'confetti':
        return <FallingConfetti />;
      case 'stars':
        return <TwinklingStars />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      // Support Hover Web/PWA
      {...(Platform.OS === 'web' ? {
        onMouseEnter: () => setIsPaused(true),
        onMouseLeave: () => setIsPaused(false)
      } : {})}
      style={styles.bannerContainer}
    >
      <LinearGradient
        colors={['#F5D142', '#EBB02D']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Micro-animations confinées */}
        {renderMicroAnimation()}

        {/* Diapositive animée */}
        <Animated.View style={[styles.slideContent, { opacity: fadeAnim, transform: [{ translateX: slideXAnim }] }]}>
          <View style={styles.textContent}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>{activeSlide.badge}</Text>
            </View>
            <Text style={styles.titleText} numberOfLines={2}>
              {activeSlide.title}
            </Text>
            <Text style={styles.bodyText} numberOfLines={2}>
              {activeSlide.body}
            </Text>
          </View>

          {/* Composition Image Premium */}
          <View style={styles.imageWrapper}>
            <Animated.Image 
              source={{ uri: activeSlide.image }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Indicateurs de diapositives (dots) si plusieurs slides */}
        {slides.length > 1 && (
          <View style={styles.indicatorsRow}>
            {slides.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot, 
                  currentIndex === index ? styles.dotActive : styles.dotInactive
                ]} 
              />
            ))}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    height: 160,
    borderRadius: THEME.BORDERS.radius.xl,
    overflow: 'hidden',
    backgroundColor: '#F5D142',
    marginBottom: THEME.SPACING.md,
    ...THEME.SHADOWS.strong
  },
  gradientContainer: {
    flex: 1,
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.md,
    justifyContent: 'center',
    position: 'relative',
  },
  slideContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
    paddingRight: THEME.SPACING.md,
    justifyContent: 'center',
    zIndex: 2,
  },
  badgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.BORDERS.radius.sm,
    marginBottom: THEME.SPACING.xs,
  },
  badgeText: {
    color: '#F5D142',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A0A0A',
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 12,
    color: '#2A2A2A',
    lineHeight: 16,
    fontWeight: '500',
  },
  imageWrapper: {
    width: 85,
    height: 85,
    borderRadius: THEME.BORDERS.radius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  indicatorsRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 8,
    left: THEME.SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 14,
    backgroundColor: '#000000',
  },
  dotInactive: {
    width: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  
  // Styles des animations
  bubble: {
    position: 'absolute',
    bottom: -15,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  confetto: {
    position: 'absolute',
    top: -10,
    width: 6,
    height: 10,
    borderRadius: 1,
  },
  starWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default MarketplaceBanner;
