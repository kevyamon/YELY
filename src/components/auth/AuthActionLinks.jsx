//src/components/auth/AuthActionLinks.jsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import THEME from '../../theme/theme';

const AuthActionLinks = ({ 
  leftLabel, 
  leftOnPress, 
  rightLabel, 
  rightOnPress,
  centeredLabel,
  centeredOnPress,
  subLabel,
  subActionLabel,
  subOnPress
}) => {
  return (
    <View style={styles.container}>
      {(leftLabel || rightLabel) && (
        <View style={styles.row}>
          {leftLabel && (
            <TouchableOpacity onPress={leftOnPress}>
              <Text style={styles.linkTextDimmed}>{leftLabel}</Text>
            </TouchableOpacity>
          )}
          {rightLabel && (
            <TouchableOpacity onPress={rightOnPress}>
              <Text style={styles.linkTextHighlight}>{rightLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {centeredLabel && (
        <TouchableOpacity onPress={centeredOnPress} style={styles.centered}>
          <Text style={styles.linkTextHighlight}>{centeredLabel}</Text>
        </TouchableOpacity>
      )}

      {(subLabel && subActionLabel) && (
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {subLabel}{' '}
            <Text onPress={subOnPress} style={styles.linkTextHighlight}>
              {subActionLabel}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginTop: THEME.SPACING.md, 
    gap: THEME.SPACING.lg 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: THEME.SPACING.xs 
  },
  centered: {
    alignItems: 'center'
  },
  footerRow: { 
    alignItems: 'center',
    marginTop: THEME.SPACING.md
  },
  linkTextDimmed: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: THEME.FONTS.sizes.bodySmall, 
    fontWeight: THEME.FONTS.weights.bold, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  linkTextHighlight: { 
    color: THEME.COLORS.primary, 
    fontSize: THEME.FONTS.sizes.bodySmall, 
    fontWeight: THEME.FONTS.weights.bold, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  footerText: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: THEME.FONTS.sizes.body 
  }
});

export default AuthActionLinks;