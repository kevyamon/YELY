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
COLORS.glassLight = COLORS.glassSurface;
COLORS.glassBorder = COLORS.border;

// ═══════════════════════════════════════════════════════════════
// 3. TYPOGRAPHIE (Inchangée mais optimisée)
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
};

// ═══════════════════════════════════════════════════════════════
// 4. ESPACEMENTS & BORDURES
// ═══════════════════════════════════════════════════════════════
const SPACING = {
  xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40,
};

const BORDERS = {
  radius: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 9999,
  },
  width: {
    thin: 0.5, normal: 1, medium: 2, thick: 3,
  },
};

// ═══════════════════════════════════════════════════════════════
// 5. OMBRES (Adaptées Jour/Nuit)
// ═══════════════════════════════════════════════════════════════
const SHADOWS = {
  soft: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08, // Ombre plus légère le jour
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.4 : 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  gold: {
    shadowColor: PALETTE.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
};

// ═══════════════════════════════════════════════════════════════
// 6. STYLES GLASSMORPHISM (ADAPTATIF)
// ═══════════════════════════════════════════════════════════════
const GLASS = {
  card: {
    backgroundColor: COLORS.glassSurface,
    borderRadius: BORDERS.radius.xl,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.border,
    overflow: 'hidden',
    // Effet de flou simulé par la couleur de fond semi-transparente
  },
  input: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
    borderRadius: BORDERS.radius.lg,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.border,
  },
};

// ═══════════════════════════════════════════════════════════════
// 7. LAYOUT & DIMENSIONS
// ═══════════════════════════════════════════════════════════════
const LAYOUT = {
  window: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  spacing: SPACING,
  radius: BORDERS.radius,
  HEADER_HEIGHT: 60,
  HEADER_MAX_HEIGHT: 180,
};

const DIMENSIONS = {
  screen: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  button: { height: 52 },
  input: { height: 52 },
};

// ═══════════════════════════════════════════════════════════════
// 8. STYLES DE COMPOSANTS UNIFIÉS
// ═══════════════════════════════════════════════════════════════
const COMPONENT_STYLES = {
  // BOUTON PRINCIPAL : Toujours OR, Texte toujours contrasté (Noir ou Blanc selon luminosité de l'Or)
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
    color: '#000000', // Noir sur Or est plus lisible et Premium
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.bold,
  },
  
  // BOUTON SECONDAIRE : Outline
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: BORDERS.radius.pill,
    height: DIMENSIONS.button.height,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary, // S'adapte (Noir le jour, Blanc la nuit)
  },
  buttonSecondaryText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.semiBold,
  },

  // INPUTS
  inputField: {
    ...GLASS.input,
    height: DIMENSIONS.input.height,
    paddingHorizontal: SPACING.lg,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.body,
  },
  
  // CONTAINERS
  pageContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
};

// ═══════════════════════════════════════════════════════════════
// 9. THÈME REACT NATIVE PAPER (MD3)
// ═══════════════════════════════════════════════════════════════
const BasePaperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

const YelyTheme = {
  ...BasePaperTheme,
  colors: {
    ...BasePaperTheme.colors,
    primary: COLORS.primary,
    onPrimary: '#000000', // Noir sur Or
    background: COLORS.background,
    surface: COLORS.glassSurface,
    onSurface: COLORS.textPrimary,
    error: COLORS.danger,
    // Custom
    champagneGold: COLORS.primary,
    textSecondary: COLORS.textSecondary,
  },
};

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════
const THEME = {
  COLORS,
  FONTS,
  SPACING,
  BORDERS,
  SHADOWS,
  GLASS,
  LAYOUT,
  DIMENSIONS,
  COMPONENT_STYLES,
  // Alias pour éviter les erreurs dans les anciens fichiers
  ANIMATIONS: { // Ajout pour compatibilité
    duration: { normal: 300 }, 
  },
  ICONS: {
      colors: {
          default: COLORS.textSecondary,
          active: COLORS.primary,
      }
  }
};

export {
  BORDERS, COLORS, COMPONENT_STYLES, DIMENSIONS, FONTS, GLASS,
  LAYOUT, SHADOWS, SPACING, YelyTheme
};

export default THEME;