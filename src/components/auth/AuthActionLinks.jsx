import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import THEME from '../../theme/theme';

const AuthActionLinks = ({ 
  leftLabel, 
  leftOnPress, 
  rightLabel, 
  rightOnPress,
  subLabel,
  subActionLabel,
  subOnPress
}) => {
  return (
    <View style={styles.container}>
      {(leftLabel || rightLabel) && (
        <View style={styles.rowMode}>
          {leftLabel && (
            <TouchableOpacity onPress={leftOnPress} activeOpacity={0.7}>
              <Text style={styles.linkTextDimmed}>{leftLabel}</Text>
            </TouchableOpacity>
          )}
          {rightLabel && (
            <TouchableOpacity onPress={rightOnPress} activeOpacity={0.7}>
              <Text style={styles.linkTextHighlight}>{rightLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {(subLabel && subActionLabel) && (
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{subLabel} </Text>
          <TouchableOpacity onPress={subOnPress} activeOpacity={0.7}>
            <Text style={styles.linkTextHighlight}>{subActionLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginTop: THEME.SPACING.xl, 
  },
  rowMode: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  footerRow: { 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: THEME.SPACING.md
  },
  linkTextDimmed: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: THEME.FONTS.sizes.bodySmall, 
    fontWeight: THEME.FONTS.weights.semiBold, 
  },
  linkTextHighlight: { 
    color: THEME.COLORS.primary, 
    fontSize: THEME.FONTS.sizes.bodySmall, 
    fontWeight: THEME.FONTS.weights.bold, 
  },
  footerText: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: THEME.FONTS.sizes.body 
  }
});

export default AuthActionLinks;