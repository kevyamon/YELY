// src/theme/themeEngine.js
// MOTEUR DE THÈME DYNAMIQUE - Interception de StyleSheet.create
// Permet la transition fluide et instantanée sans rechargement de bundle
// CSCSM Level: Bank Grade

import { StyleSheet } from 'react-native';
import THEME, { updateThemeColors, YelyTheme } from './theme';

// Sécurisation globale pour éviter la double initialisation
if (!global.__themeEngineInitialized) {
  global.__themeEngineInitialized = true;
  
  const registeredStyles = [];

  const PROPERTY_PRIORITIES = {
    backgroundColor: ['background', 'glassSurface', 'glassModal', 'overlay', 'primary', 'secondary'],
    color: ['textPrimary', 'textSecondary', 'textTertiary', 'primary', 'secondary', 'textInverse'],
    borderColor: ['border', 'borderActive', 'primary', 'secondary'],
    borderTopColor: ['border', 'borderActive', 'primary', 'secondary'],
    borderBottomColor: ['border', 'borderActive', 'primary', 'secondary'],
    borderLeftColor: ['border', 'borderActive', 'primary', 'secondary'],
    borderRightColor: ['border', 'borderActive', 'primary', 'secondary'],
    shadowColor: ['shadow', 'primary'],
    tintColor: ['primary', 'secondary', 'textPrimary']
  };

  const COLOR_PROPERTIES = [
    'backgroundColor',
    'color',
    'borderColor',
    'borderTopColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderRightColor',
    'shadowColor',
    'overlayColor',
    'tintColor'
  ];

  // Normalisation des couleurs pour comparaison insensible à la casse et aux espaces (hex, rgb, rgba)
  const normalizeColor = (colorStr) => {
    if (typeof colorStr !== 'string') return '';
    return colorStr.replace(/\s+/g, '').toLowerCase();
  };

  const findThemeColorKey = (prop, val, themeColors) => {
    const normalizedVal = normalizeColor(val);
    if (!normalizedVal) return null;

    const priorities = PROPERTY_PRIORITIES[prop] || [];
    
    // 1. Recherche par ordre de priorité de propriété
    for (const key of priorities) {
      if (themeColors[key] && normalizeColor(themeColors[key]) === normalizedVal) {
        return key;
      }
    }
    
    // 2. Recherche générale sur toutes les clés
    for (const key in themeColors) {
      if (themeColors[key] && normalizeColor(themeColors[key]) === normalizedVal) {
        return key;
      }
    }
    
    return null;
  };

  // Surcharge de StyleSheet.create
  StyleSheet.create = (styles) => {
    // Crée une copie entièrement mutable (évite Object.freeze natif de React Native en dev)
    const sheet = {};
    for (const key in styles) {
      if (styles[key]) {
        sheet[key] = { ...styles[key] };
      }
    }

    const themeColors = { ...THEME.COLORS };

    for (const key in sheet) {
      const styleObj = sheet[key];
      for (const prop in styleObj) {
        if (COLOR_PROPERTIES.includes(prop)) {
          const val = styleObj[prop];
          if (typeof val === 'string') {
            const matchedKey = findThemeColorKey(prop, val, themeColors);
            if (matchedKey) {
              registeredStyles.push({
                sheet,
                key,
                prop,
                themeKey: matchedKey
              });
            }
          }
        }
      }
    }

    return sheet;
  };

  // Moteur d'application de mise à jour synchrone du thème
  global.__applyThemeUpdate = (newScheme) => {
    // 1. Met à jour les tokens globaux dans le module theme
    updateThemeColors(newScheme);
    const themeColors = { ...THEME.COLORS };

    // 2. Met à jour les couleurs de YelyTheme (React Native Paper)
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

    // 3. Met à jour toutes les feuilles de style enregistrées en mémoire
    for (const item of registeredStyles) {
      const { sheet, key, prop, themeKey } = item;
      if (sheet[key] && themeColors[themeKey]) {
        sheet[key][prop] = themeColors[themeKey];
      }
    }
  };
}

export function applyThemeUpdate(newScheme) {
  if (global.__applyThemeUpdate) {
    global.__applyThemeUpdate(newScheme);
  }
}
