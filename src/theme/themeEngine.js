// src/theme/themeEngine.js
// MOTEUR DE GESTION THEME - Synchronisation atomique sans alteration du moteur CSS
// STANDARD: Industriel / Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { Platform } from 'react-native';
import THEME, { updateThemeColors, YelyTheme } from './theme';

if (!global.__themeEngineInitialized) {
  global.__themeEngineInitialized = true;

  global.__applyThemeUpdate = (newScheme) => {
    // 1. Mise a jour des tokens globaux dans le module theme
    updateThemeColors(newScheme);
    const themeColors = { ...THEME.COLORS };

    // 2. Mise a jour des couleurs de YelyTheme (React Native Paper)
    if (YelyTheme && YelyTheme.colors) {
      YelyTheme.colors.primary = themeColors.primary;
      YelyTheme.colors.onPrimary = themeColors.textInverse;
      YelyTheme.colors.background = themeColors.background;
      YelyTheme.colors.surface = themeColors.glassSurface;
      YelyTheme.colors.onSurface = themeColors.textPrimary;
      YelyTheme.colors.error = themeColors.danger;
      YelyTheme.colors.champagneGold = themeColors.primary;
      YelyTheme.colors.textSecondary = themeColors.textSecondary;
      YelyTheme.colors.textTertiary = themeColors.textTertiary;
      YelyTheme.colors.success = themeColors.success;
      YelyTheme.colors.warning = themeColors.warning;
      YelyTheme.colors.info = themeColors.info;
    }
  };
}

export function applyThemeUpdate(newScheme) {
  if (global.__applyThemeUpdate) {
    global.__applyThemeUpdate(newScheme);
  }
}
