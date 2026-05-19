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
// 🧼 ANIMATION 4 : BALLONS FLOTTANTS (BALLOONS)
// ==========================================
const FloatingBalloons = () => {
  const balloonCount = 5;
  const anims = useRef([...Array(balloonCount)].map(() => new Animated.Value(0))).current;
  const colors = ['#E74C3C', '#3498DB', '#9B59B6', '#E67E22', '#F1C40F'];

  useEffect(() => {
    const startAnimation = (index) => {
      anims[index].setValue(0);
      Animated.timing(anims[index], {
        toValue: 1,
        duration: 4500 + Math.random() * 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startAnimation(index));
    };

    anims.forEach((_, i) => {
      const timeout = setTimeout(() => startAnimation(i), i * 900);
      return () => clearTimeout(timeout);
    });
  }, [anims]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((anim, i) => {
        const left = 15 + i * 18 + Math.random() * 5;
        const color = colors[i % colors.length];

        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [180, -40]
        });
        const translateX = anim.interpolate({
          inputRange: [0, 0.4, 0.8, 1],
          outputRange: [0, 12, -12, 0]
        });
        const scale = anim.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0.6, 1, 1, 0.6]
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.balloonContainer,
              {
                left: `${left}%`,
                transform: [{ translateY }, { translateX }, { scale }],
              }
            ]}
          >
            <View style={[styles.balloonBody, { backgroundColor: color }]} />
            <View style={[styles.balloonKnot, { borderBottomColor: color }]} />
            <View style={styles.balloonString} />
          </Animated.View>
        );
      })}
    </View>
  );
};

// ==========================================
// 🧼 ANIMATION 5 : PLUIE D'ÉTOILES FILANTES (METEORS)
// ==========================================
const MeteorShower = () => {
  const meteorCount = 4;
  const anims = useRef([...Array(meteorCount)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const startAnimation = (index) => {
      anims[index].setValue(0);
      Animated.timing(anims[index], {
        toValue: 1,
        duration: 1200 + Math.random() * 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => startAnimation(index), delay);
      });
    };

    anims.forEach((_, i) => {
      const timeout = setTimeout(() => startAnimation(i), i * 1000);
      return () => clearTimeout(timeout);
    });
  }, [anims]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((anim, i) => {
        const top = 10 + i * 25;
        const left = 20 + i * 15;

        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, SCREEN_WIDTH]
        });
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, 200]
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.2, 0.6, 1],
          outputRange: [0, 1, 0.8, 0]
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.meteor,
              {
                top: `${top}%`,
                left: `${left}%`,
                transform: [{ translateX }, { translateY }],
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
// 🧼 ANIMATION 6 : LUCIOLES MAGIQUES (FIREFLIES)
// ==========================================
const MagicalFireflies = () => {
  const fireflyCount = 8;
  const anims = useRef([...Array(fireflyCount)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const startAnimation = (index) => {
      anims[index].setValue(0);
      Animated.sequence([
        Animated.timing(anims[index], {
          toValue: 1,
          duration: 2000 + Math.random() * 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anims[index], {
          toValue: 0,
          duration: 2000 + Math.random() * 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        })
      ]).start(() => startAnimation(index));
    };

    anims.forEach((_, i) => {
      const timeout = setTimeout(() => startAnimation(i), i * 500);
      return () => clearTimeout(timeout);
    });
  }, [anims]);

  const fireflyPositions = [
    { top: '20%', left: '15%' },
    { top: '35%', left: '70%' },
    { top: '70%', left: '30%' },
    { top: '15%', left: '85%' },
    { top: '80%', left: '75%' },
    { top: '55%', left: '10%' },
    { top: '45%', left: '55%' },
    { top: '75%', left: '90%' }
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((anim, i) => {
        const scale = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.4, 1.2, 0.4]
        });
        const translateY = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, -15, 0]
        });
        const translateX = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 10, 0]
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.firefly,
              fireflyPositions[i],
              {
                transform: [{ scale }, { translateY }, { translateX }],
                opacity: anim,
              }
            ]}
          />
        );
      })}
    </View>
  );
};

// ==========================================
// 🧼 ANIMATION 7 : AURA DE LUMIÈRE (AURORA)
// ==========================================
const PulsingAura = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const start = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => start());
    };
    start();
  }, [anim]);

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.4, 0.8]
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.15, 0.4, 0.15]
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View 
        style={[
          styles.auroraGlow,
          {
            transform: [{ scale }],
            opacity,
          }
        ]}
      />
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

  // Sécurité anti out-of-bounds sur changement dynamique de slides
  useEffect(() => {
    if (slides.length > 0 && currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Lance l'intervalle de défilement de 6.5s
  useEffect(() => {
    if (slides.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      if (slides.length === 0) return;

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
        // Changement d'index diapo sécurisé
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          return nextIndex >= slides.length ? 0 : nextIndex;
        });
        
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

  // Sélection ultra-sécurisée avec double fallback
  const activeSlide = slides[currentIndex] || slides[0] || null;

  if (!activeSlide) {
    return null;
  }

  // Pause tactile/hover
  const handlePressIn = () => {
    setIsPaused(true);
  };

  const handlePressOut = () => {
    setIsPaused(false);
  };

  // Rendu de l'animation associée au slide (Fallback intelligent si type non spécifié)
  const renderMicroAnimation = () => {
    try {
      const type = activeSlide.animationType || ['confetti', 'stars', 'bubbles', 'balloons', 'meteors', 'fireflies', 'aurora'][currentIndex % 7];
      switch (type) {
        case 'bubbles':
          return <RisingBubbles />;
        case 'confetti':
          return <FallingConfetti />;
      case 'stars':
        return <TwinklingStars />;
      case 'balloons':
        return <FloatingBalloons />;
      case 'meteors':
        return <MeteorShower />;
      case 'fireflies':
        return <MagicalFireflies />;
      case 'aurora':
        return <PulsingAura />;
      default:
        return null;
    }
    } catch (e) {
      console.warn("Failed to render micro animation:", e);
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
  },
  
  // Ballons
  balloonContainer: {
    position: 'absolute',
    bottom: -50,
    width: 20,
    height: 25,
    alignItems: 'center',
    zIndex: 1,
  },
  balloonBody: {
    width: 20,
    height: 24,
    borderRadius: 10,
  },
  balloonKnot: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  balloonString: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  
  // Étoiles filantes (Météores)
  meteor: {
    position: 'absolute',
    width: 60,
    height: 1.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  
  // Lucioles
  firefly: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Aura lumineuse
  auroraGlow: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  }
});

export default MarketplaceBanner;
