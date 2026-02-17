// src/theme/theme.js - LE FICHIER MAÎTRE DU THÈME
// Ce fichier est importé PARTOUT. Il est la source unique de vérité visuelle.

import { Dimensions, Platform } from 'react-native';
import { MD3DarkTheme } from 'react-native-paper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// 1. PALETTE DE COULEURS - "LUXE NOCTURNE & TRANSPARENCE"
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  // ⚠️ CORRECTION : Couleur rendue OPAQUE pour le Header "Canva"
  deepAsphalt: '#120128', 
  deepAsphaltRGB: '18, 20, 24',

  champagneGold: '#1adf5b',
  champagneGoldRGB: '212, 175, 55',
  champagneGoldLight: '#E8D48B',
  champagneGoldDark: '#B8960E',

  moonlightWhite: '#F2F4F6',
  moonlightWhiteRGB: '242, 244, 246',

  success: '#2ECC71',
  successRGB: '46, 204, 113',
  danger: '#E74C3C',
  dangerRGB: '231, 76, 60',
  warning: '#F39C12',
  warningRGB: '243, 156, 18',
  info: '#3498DB',
  infoRGB: '52, 152, 219',

  glassDark: 'rgba(18, 20, 24, 0.92)',
  glassMedium: 'rgba(18, 20, 24, 0.85)',
  glassLight: 'rgba(18, 20, 24, 0.75)',
  glassUltraLight: 'rgba(18, 20, 24, 0.60)',

  textPrimary: '#F2F4F6',
  textSecondary: 'rgba(242, 244, 246, 0.70)',
  textTertiary: 'rgba(242, 244, 246, 0.45)',
  textDisabled: 'rgba(242, 244, 246, 0.25)',

  glassBorder: 'rgba(242, 244, 246, 0.50)',
  glassBorderActive: 'rgba(212, 175, 55, 0.30)',

  overlayDark: 'rgba(0, 0, 0, 0.60)',
  overlayMedium: 'rgba(0, 0, 0, 0.40)',

  transparent: 'transparent',
};

// ═══════════════════════════════════════════════════════════════
// 2. TYPOGRAPHIE
// ═══════════════════════════════════════════════════════════════
const FONTS = {
  family: {
    bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
    semiBold: Platform.OS === 'ios' ? 'System' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    light: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  sizes: {
    hero: 34,
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
    micro: 10,
  },
  weights: {
    bold: '700',
    semiBold: '600',
    medium: '500',
    regular: '400',
    light: '300',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

// ═══════════════════════════════════════════════════════════════
// 3. ESPACEMENTS (Système 4px)
// ═══════════════════════════════════════════════════════════════
const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
};

// ═══════════════════════════════════════════════════════════════
// 4. BORDURES & RADIUS
// ═══════════════════════════════════════════════════════════════
const BORDERS = {
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 9999,
    circle: 9999,
  },
  width: {
    thin: 0.5,
    normal: 1,
    medium: 1.5,
    thick: 2,
  },
};

// ═══════════════════════════════════════════════════════════════
// 5. OMBRES (Adaptées au thème sombre)
// ═══════════════════════════════════════════════════════════════
const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  strong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },
  goldSoft: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ═══════════════════════════════════════════════════════════════
// 6. ANIMATIONS - Courbes et Durées
// ═══════════════════════════════════════════════════════════════
const ANIMATIONS = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 450,
    verySlow: 600,
    dramatic: 800,
  },
  spring: {
    gentle: { damping: 20, stiffness: 150, mass: 1 },
    bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
    snappy: { damping: 25, stiffness: 300, mass: 0.8 },
    smooth: { damping: 30, stiffness: 200, mass: 1 },
  },
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeIn: 'cubic-bezier(0.65, 0, 0.35, 1)',
    easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// ═══════════════════════════════════════════════════════════════
// 7. STYLES GLASSMORPHISM PRÉ-COMPOSÉS
// ═══════════════════════════════════════════════════════════════
const GLASS = {
  card: {
    backgroundColor: COLORS.glassMedium,
    borderRadius: BORDERS.radius.xl,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  surface: {
    backgroundColor: COLORS.glassDark,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
  },
  subtle: {
    backgroundColor: COLORS.glassUltraLight,
    borderRadius: BORDERS.radius.lg,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
  },
  goldHighlight: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: BORDERS.radius.xl,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorderActive,
  },
};

// ═══════════════════════════════════════════════════════════════
// 8. DIMENSIONS RESPONSIVE
// ═══════════════════════════════════════════════════════════════
const DIMENSIONS = {
  screen: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  sidebar: { width: SCREEN_WIDTH * 0.78, maxWidth: 320 },
  header: {
    height: Platform.OS === 'ios' ? 96 : 72,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
  },
  drawer: {
    collapsed: SCREEN_HEIGHT * 0.28,
    expanded: SCREEN_HEIGHT * 0.55,
    full: SCREEN_HEIGHT * 0.85,
  },
  button: { height: 52, heightSmall: 40, heightLarge: 58 },
  input: { height: 52 },
  forfaitCard: { width: SCREEN_WIDTH * 0.72, height: 160 },
  badge: { size: 20, sizeLarge: 28 },
};

// ═══════════════════════════════════════════════════════════════
// 9. CONSTANTES DE LAYOUT (COMMANDANT SUPRÊME)
// ═══════════════════════════════════════════════════════════════
const LAYOUT = {
  // Alias pour compatibilité
  window: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  isSmallDevice: SCREEN_WIDTH < 375,
  
  // ⚠️ CRITIQUE : Mapping des propriétés pour éviter l'erreur "undefined"
  // On mappe explicitement pour que LAYOUT.spacing.md et LAYOUT.radius.lg fonctionnent
  spacing: SPACING, 
  radius: BORDERS.radius, // CORRECTION ICI: c'était 'borderRadius', maintenant c'est 'radius'

  // Hauteurs pour l'animation du SmartHeader
  HEADER_HEIGHT: 60,         // Hauteur minimum (réduit)
  HEADER_MAX_HEIGHT: 180,    // Hauteur maximum (étendu)
};

// ═══════════════════════════════════════════════════════════════
// 10. STYLES DE COMPOSANTS PRÉ-COMPOSÉS
// ═══════════════════════════════════════════════════════════════
const COMPONENT_STYLES = {
  buttonPrimary: {
    backgroundColor: COLORS.champagneGold,
    borderRadius: BORDERS.radius.pill,
    height: DIMENSIONS.button.height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    ...SHADOWS.gold,
  },
  buttonPrimaryText: {
    color: COLORS.deepAsphalt,
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 0.5,
  },
  buttonSecondary: {
    backgroundColor: COLORS.transparent,
    borderRadius: BORDERS.radius.pill,
    height: DIMENSIONS.button.height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    borderWidth: BORDERS.width.normal,
    borderColor: COLORS.moonlightWhite,
  },
  buttonSecondaryText: {
    color: COLORS.moonlightWhite,
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.semiBold,
  },
  buttonDanger: {
    backgroundColor: COLORS.danger,
    borderRadius: BORDERS.radius.pill,
    height: DIMENSIONS.button.height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  buttonDangerText: {
    color: COLORS.moonlightWhite,
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.bold,
  },
  inputField: {
    height: DIMENSIONS.input.height,
    backgroundColor: COLORS.glassLight,
    borderRadius: BORDERS.radius.lg,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.lg,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.body,
  },
  inputFieldFocused: {
    borderColor: COLORS.champagneGold,
    borderWidth: BORDERS.width.medium,
  },
  sectionContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: SPACING.md,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: COLORS.deepAsphalt,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.deepAsphalt,
  },
};

// ═══════════════════════════════════════════════════════════════
// 11. ICÔNES CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const ICONS = {
  sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32, xxl: 40, hero: 64 },
  colors: {
    default: COLORS.textSecondary,
    active: COLORS.champagneGold,
    inactive: COLORS.textTertiary,
  },
};

// ═══════════════════════════════════════════════════════════════
// 12. THÈME REACT NATIVE PAPER (MD3) - Compatible PaperProvider
// ═══════════════════════════════════════════════════════════════
const YelyTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.champagneGold,
    onPrimary: COLORS.deepAsphalt,
    primaryContainer: COLORS.champagneGoldDark,
    onPrimaryContainer: COLORS.champagneGoldLight,
    secondary: COLORS.moonlightWhite,
    onSecondary: COLORS.deepAsphalt,
    secondaryContainer: COLORS.glassMedium,
    onSecondaryContainer: COLORS.moonlightWhite,
    background: COLORS.deepAsphalt,
    onBackground: COLORS.moonlightWhite,
    surface: COLORS.glassDark,
    onSurface: COLORS.moonlightWhite,
    surfaceVariant: COLORS.glassMedium,
    onSurfaceVariant: COLORS.textSecondary,
    outline: COLORS.glassBorder,
    error: COLORS.danger,
    onError: COLORS.moonlightWhite,
    // Couleurs custom ajoutées
    textSecondary: COLORS.textSecondary,
    textTertiary: COLORS.textTertiary,
    champagneGold: COLORS.champagneGold,
    success: COLORS.success,
    warning: COLORS.warning,
    info: COLORS.info,
  },
};

// ═══════════════════════════════════════════════════════════════
// EXPORT UNIFIÉ
// ═══════════════════════════════════════════════════════════════
const THEME = {
  COLORS,
  FONTS,
  SPACING,
  BORDERS,
  SHADOWS,
  ANIMATIONS,
  GLASS,
  DIMENSIONS,
  LAYOUT,
  COMPONENT_STYLES,
  ICONS,
};

export {
  ANIMATIONS,
  BORDERS,
  COLORS,
  COMPONENT_STYLES,
  DIMENSIONS,
  FONTS,
  GLASS,
  ICONS,
  LAYOUT,
  SHADOWS,
  SPACING,
  YelyTheme
};

export default THEME;