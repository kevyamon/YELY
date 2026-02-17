// src/theme/theme.js
// LE COEUR DE L'IDENTITÉ VISUELLE - YÉLY REBRANDING (OR / BLANC / NOIR)
// Ce fichier gère dynamiquement le mode SOMBRE et le mode CLAIR.

import { Appearance, Dimensions, Platform } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// DÉTECTION DU MODE SYSTÈME (Dark vs Light)
const colorScheme = Appearance.getColorScheme();
const isDark = colorScheme === 'dark';

// ═══════════════════════════════════════════════════════════════
// 1. PALETTE PRIMITIVE (Les ingrédients bruts)
// ═══════════════════════════════════════════════════════════════
const PALETTE = {
  // L'OR YÉLY (Identité de Marque)
  gold: '#D4AF37',       // Vrai Or Classique
  goldLight: '#F3E5AB',  // Or Pâle (Champagne)
  goldDark: '#AA8C2C',   // Or Vieilli (Ombres)
  
  // LE BLANC (Mode Jour)
  pureWhite: '#FFFFFF',
  offWhite: '#F8F9FA',   // Blanc cassé (Anti-éblouissement)
  softGray: '#E9ECEF',   // Gris très léger pour les séparateurs

  // LE NOIR (Mode Nuit)
  pureBlack: '#000000',
  richBlack: '#0A0A0A',  // Noir Premium (Pas gris, juste profond)
  charcoal: '#121212',   // Surface sombre standard

  // FONCTIONNEL
  success: '#27AE60',    // Vert Émeraude (Plus classe que le vert néon)
  danger: '#C0392B',     // Rouge Rubis (Plus profond)
  warning: '#F39C12',
  info: '#2980B9',
};

// ═══════════════════════════════════════════════════════════════
// 2. COULEURS SÉMANTIQUES (L'adaptation Jour/Nuit)
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  // --- FONDAMENTAUX ---
  // Le fond principal change radicalement selon le mode
  background: isDark ? PALETTE.pureBlack : PALETTE.offWhite,
  
  // Couleur principale (L'OR reste constant mais s'ajuste légèrement)
  primary: PALETTE.gold,
  primaryLight: PALETTE.goldLight,
  primaryDark: PALETTE.goldDark,

  // Couleur secondaire (Contraste absolu)
  secondary: isDark ? PALETTE.pureWhite : PALETTE.pureBlack,

  // --- TYPOGRAPHIE ---
  // En mode Jour, on écrit en Noir. En mode Nuit, en Blanc.
  textPrimary: isDark ? '#F8F9FA' : '#1A1A1A',
  textSecondary: isDark ? 'rgba(248, 249, 250, 0.70)' : 'rgba(26, 26, 26, 0.70)', 
  textTertiary: isDark ? 'rgba(248, 249, 250, 0.45)' : 'rgba(26, 26, 26, 0.45)',
  textInverse: isDark ? '#1A1A1A' : '#FFFFFF', // Pour le texte sur bouton Or

  // --- GLASSMORPHISM & SURFACES ---
  // Glass: Blanc givré le jour / Fumé sombre la nuit
  glassSurface: isDark ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  glassModal: isDark ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  
  // Bordures : Subtiles et adaptées
  border: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
  borderActive: PALETTE.gold,

  // Fonctionnel
  success: PALETTE.success,
  danger: PALETTE.danger,
  warning: PALETTE.warning,
  info: PALETTE.info,
  
  // Utilitaires
  transparent: 'transparent',
  overlay: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  shadow: isDark ? '#000000' : '#888888', // Ombres grises le jour pour le réalisme
};

// COMPATIBILITÉ RÉTROACTIVE (Pour ne pas casser les vieux imports)
COLORS.deepAsphalt = COLORS.background; // Redirige vers le nouveau fond
COLORS.champagneGold = COLORS.primary;
COLORS.moonlightWhite = COLORS.textPrimary;
COLORS.glassDark = COLORS.glassSurface;
COLORS.glassMedium = COLORS.glassSurface;
COLORS.glassLight = COLORS.glassSurface;
COLORS.glassUltraLight = COLORS.glassSurface;
COLORS.glassBorder = COLORS.border;
COLORS.glassBorderActive = COLORS.borderActive;
COLORS.textDisabled = 'rgba(128, 128, 128, 0.5)';
COLORS.overlayDark = 'rgba(0, 0, 0, 0.60)';
COLORS.overlayMedium = 'rgba(0, 0, 0, 0.40)';

// ═══════════════════════════════════════════════════════════════
// 3. TYPOGRAPHIE
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
    hero: 34, h1: 28, h2: 24, h3: 20, h4: 18,
    body: 16, bodySmall: 14, caption: 12, micro: 10,
  },
  weights: {
    bold: '700', semiBold: '600', medium: '500', regular: '400', light: '300',
  },
  lineHeights: {
    tight: 1.2, normal: 1.5, relaxed: 1.8,
  },
};

// ═══════════════════════════════════════════════════════════════
// 4. ESPACEMENTS & BORDURES
// ═══════════════════════════════════════════════════════════════
const SPACING = {
  xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40, massive: 48, giant: 64,
};

const BORDERS = {
  radius: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 9999, circle: 9999,
  },
  width: {
    thin: 0.5, normal: 1, medium: 1.5, thick: 2,
  },
};

// ═══════════════════════════════════════════════════════════════
// 5. OMBRES (Adaptées Jour/Nuit)
// ═══════════════════════════════════════════════════════════════
const SHADOWS = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  soft: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.4 : 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  strong: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.45 : 0.20,
    shadowRadius: 16,
    elevation: 12,
  },
  gold: {
    shadowColor: PALETTE.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },
  goldSoft: {
    shadowColor: PALETTE.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ═══════════════════════════════════════════════════════════════
// 6. ANIMATIONS ET ICÔNES (RÉTABLIS EN CONSTANTES STRICTES)
// ═══════════════════════════════════════════════════════════════
const ANIMATIONS = {
  duration: { instant: 100, fast: 200, normal: 300, slow: 450, verySlow: 600, dramatic: 800 },
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

const ICONS = {
  sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32, xxl: 40, hero: 64 },
  colors: {
    default: COLORS.textSecondary,
    active: COLORS.primary,
    inactive: COLORS.textTertiary,
  },
};

// ═══════════════════════════════════════════════════════════════
// 7. STYLES GLASSMORPHISM (ADAPTATIF)
// ═══════════════════════════════════════════════════════════════
const GLASS = {
  card: {
    backgroundColor: COLORS.glassSurface,
    borderRadius: BORDERS.radius.xl,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  surface: {
    backgroundColor: COLORS.glassSurface,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.border,
  },
  subtle: {
    backgroundColor: COLORS.glassSurface,
    borderRadius: BORDERS.radius.lg,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.border,
  },
  goldHighlight: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: BORDERS.radius.xl,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.borderActive,
  },
};

// ═══════════════════════════════════════════════════════════════
// 8. LAYOUT & DIMENSIONS
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

const LAYOUT = {
  window: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  isSmallDevice: SCREEN_WIDTH < 375,
  spacing: SPACING,
  radius: BORDERS.radius,
  HEADER_HEIGHT: 60,
  HEADER_MAX_HEIGHT: 180,
};

// ═══════════════════════════════════════════════════════════════
// 9. STYLES DE COMPOSANTS UNIFIÉS
// ═══════════════════════════════════════════════════════════════
const COMPONENT_STYLES = {
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radius.pill,
    height: DIMENSIONS.button.height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    ...SHADOWS.gold,
  },
  buttonPrimaryText: {
    color: COLORS.textInverse, // Contraste géré (Noir sur or)
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.bold,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: BORDERS.radius.pill,
    height: DIMENSIONS.button.height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary,
  },
  buttonSecondaryText: {
    color: COLORS.textPrimary,
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
    color: '#FFFFFF',
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.bold,
  },
  inputField: {
    height: DIMENSIONS.input.height,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
    borderRadius: BORDERS.radius.lg,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.body,
  },
  inputFieldFocused: {
    borderColor: COLORS.primary,
    borderWidth: BORDERS.width.medium,
  },
  sectionContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
};

// ═══════════════════════════════════════════════════════════════
// 10. THÈME REACT NATIVE PAPER (MD3)
// ═══════════════════════════════════════════════════════════════
const BasePaperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

const YelyTheme = {
  ...BasePaperTheme,
  colors: {
    ...BasePaperTheme.colors,
    primary: COLORS.primary,
    onPrimary: COLORS.textInverse,
    background: COLORS.background,
    surface: COLORS.glassSurface,
    onSurface: COLORS.textPrimary,
    error: COLORS.danger,
    champagneGold: COLORS.primary,
    textSecondary: COLORS.textSecondary,
    textTertiary: COLORS.textTertiary,
    success: COLORS.success,
    warning: COLORS.warning,
    info: COLORS.info,
  },
};

// ═══════════════════════════════════════════════════════════════
// EXPORT UNIFIÉ & SÉCURISÉ (Rétrocompatibilité Totale)
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

// Il est crucial d'exporter séparément chaque constante pour que 
// `import { ANIMATIONS } from 'theme'` fonctionne sans casser.
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