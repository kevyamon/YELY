// src/components/ui/GlassModal.jsx
// Modale avec effet Glassmorphism et animations premium

import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import {
    BackHandler,
    Dimensions,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { ANIMATIONS, BORDERS, COLORS, SHADOWS, SPACING } from '../../theme/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GlassModal = ({
  visible,
  onClose,
  children,
  position = 'center', // 'center', 'bottom', 'top'
  closeOnBackdrop = true,
  showHandle = false, // Pour les bottom sheets
  fullWidth = false,
  style,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: ANIMATIONS.duration.normal });
      opacity.value = withTiming(1, { duration: ANIMATIONS.duration.normal });

      const startY = position === 'top' ? -300 : position === 'bottom' ? 300 : 100;
      translateY.value = startY;
      translateY.value = withSpring(0, ANIMATIONS.spring.gentle);
    } else {
      backdropOpacity.value = withTiming(0, { duration: ANIMATIONS.duration.fast });
      opacity.value = withTiming(0, { duration: ANIMATIONS.duration.fast });

      const endY = position === 'bottom' ? 300 : 100;
      translateY.value = withTiming(endY, {
        duration: ANIMATIONS.duration.normal,
      });
    }
  }, [visible]);

  // Gestion du bouton retour Android
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose?.();
      return true;
    });

    return () => backHandler.remove();
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom':
        return styles.positionBottom;
      case 'top':
        return styles.positionTop;
      default:
        return styles.positionCenter;
    }
  };

  return (
    <View style={styles.overlay}>
      {/* Backdrop flou */}
      <TouchableWithoutFeedback
        onPress={closeOnBackdrop ? onClose : undefined}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.overlayDark }]} />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Contenu de la modale */}
      <View style={[styles.modalPositioner, getPositionStyle()]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.modalContainer,
            position === 'bottom' && styles.bottomModalContainer,
            fullWidth && styles.fullWidthModal,
            modalStyle,
            style,
          ]}
        >
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}
          {children}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalPositioner: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
  },
  positionCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  positionBottom: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  positionTop: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
  modalContainer: {
    backgroundColor: COLORS.glassDark,
    borderRadius: BORDERS.radius.xxl,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
    padding: SPACING.xxl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.strong,
  },
  bottomModalContainer: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: BORDERS.radius.xxl,
    borderTopRightRadius: BORDERS.radius.xxl,
    paddingBottom: SPACING.massive,
    maxWidth: '100%',
  },
  fullWidthModal: {
    maxWidth: '100%',
    marginHorizontal: 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.textTertiary,
    borderRadius: BORDERS.radius.pill,
  },
});

export default GlassModal;