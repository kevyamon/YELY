// src/components/ui/GlassModal.jsx
// Modale avec effet Glassmorphism et animations premium
// FIX: Ajustement automatique de la hauteur pour eviter les debordements sur petits ecrans

import { BlurView } from 'expo-blur';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import {
  Appearance,
  BackHandler,
  Dimensions,
  Modal,
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
import { useSelector, useDispatch } from 'react-redux';
import { selectToast, hideToast } from '../../store/slices/uiSlice';
import AppToast from './AppToast';
import { ANIMATIONS, BORDERS, COLORS, SHADOWS, SPACING } from '../../theme/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GlassModal = ({
  visible,
  onClose,
  children,
  position = 'center', 
  closeOnBackdrop = true,
  showHandle = false, 
  fullWidth = false,
  style,
}) => {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 180 });
      opacity.value = withTiming(1, { duration: 180 });

      const startY = position === 'top' ? -300 : position === 'bottom' ? 300 : 100;
      translateY.value = startY;
      translateY.value = withSpring(0, { damping: 18, stiffness: 180, mass: 0.8 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });

      const endY = position === 'bottom' ? 300 : 100;
      translateY.value = withTiming(endY, {
        duration: 180,
      });
    }
  }, [visible, position, backdropOpacity, opacity, translateY]);

  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose?.();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible) return;

    const subscription = Appearance.addChangeListener(async (preferences) => {
      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.warn("[GlassModal Theme Change] Reload failed:", error);
      }
    });

    return () => subscription.remove();
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={closeOnBackdrop ? onClose : undefined}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.overlayDark }]} />
            )}
          </Animated.View>
        </TouchableWithoutFeedback>

        <View style={[styles.modalPositioner, getPositionStyle(), { pointerEvents: 'box-none' }]}>
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

        <AppToast 
          visible={toast.visible && visible}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onHide={() => dispatch(hideToast())}
        />
      </View>
    </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 25, 
  },
  modalContainer: {
    backgroundColor: COLORS.glassDark,
    borderRadius: BORDERS.radius.xxl,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
    padding: SPACING.xl, 
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.85, 
    ...SHADOWS.strong,
  },
  bottomModalContainer: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: BORDERS.radius.xxl,
    borderTopRightRadius: BORDERS.radius.xxl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.massive : SPACING.xl,
    maxHeight: SCREEN_HEIGHT * 0.90,
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