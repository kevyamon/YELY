// src/components/ui/GlassInput.jsx
// Champ de saisie avec style Glassmorphism

import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { ANIMATIONS, BORDERS, COLORS, DIMENSIONS, FONTS, SPACING } from '../../theme/theme';

const AnimatedView = Animated.createAnimatedComponent(View);

const GlassInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = null,
  icon = null,
  editable = true,
  multiline = false,
  maxLength,
  style,
  inputStyle,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputRef = useRef(null);
  const focusAnim = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [COLORS.glassBorder, COLORS.champagneGold]
    ),
    borderWidth: focusAnim.value > 0.5 ? BORDERS.width.medium : BORDERS.width.thin,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: ANIMATIONS.duration.normal });
    onFocusProp?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: ANIMATIONS.duration.normal });
    onBlurProp?.();
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <AnimatedView style={[styles.container, animatedContainerStyle, error && styles.errorBorder]}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon}
              size={20}
              color={isFocused ? COLORS.champagneGold : COLORS.textTertiary}
            />
          </View>
        )}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            multiline && styles.multilineInput,
            !editable && styles.disabledInput,
            inputStyle,
          ]}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}
      </AnimatedView>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.caption,
    fontWeight: FONTS.weights.semiBold,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BORDERS.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  iconContainer: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingHorizontal: SPACING.md,
    fontWeight: '500',
  },
  inputWithIcon: {
    paddingLeft: SPACING.xs,
  },
  multilineInput: {
    height: 110,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  disabledInput: {
    opacity: 0.5,
  },
  eyeButton: {
    paddingHorizontal: SPACING.md,
    height: '100%',
    justifyContent: 'center',
  },
  errorBorder: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONTS.sizes.caption,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

export default GlassInput;