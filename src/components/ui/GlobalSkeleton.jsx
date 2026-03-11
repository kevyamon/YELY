// src/components/ui/GlobalSkeleton.jsx
// SKELETON PLEIN ECRAN - Remplacement du composant pulse central
// CSCSM Level: Bank Grade

import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, StyleSheet, View } from 'react-native';
import THEME from '../../theme/theme';

const GlobalSkeleton = ({ visible, fullScreen = true }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0.4);
    }
  }, [visible, pulseAnim]);

  if (!visible) return null;

  const renderCardSkeleton = (key) => (
    <View key={key} style={styles.card}>
      <View style={styles.cardHeader}>
        <Animated.View style={[styles.avatarBox, { opacity: pulseAnim }]} />
        <View style={styles.headerTextGroup}>
          <Animated.View style={[styles.line, styles.lineTitle, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.line, styles.lineSubtitle, { opacity: pulseAnim }]} />
        </View>
      </View>
      <Animated.View style={[styles.contentBlock, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.buttonLine, { opacity: pulseAnim }]} />
    </View>
  );

  return (
    <View style={fullScreen ? styles.overlay : styles.inlineContainer}>
      <SafeAreaView style={styles.safeArea}>
        {/* Fake Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.headerIcon, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.headerTitle, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.headerIcon, { opacity: pulseAnim }]} />
        </View>

        {/* Fake Content Cards */}
        <View style={styles.scrollContent}>
          {[1, 2, 3].map(renderCardSkeleton)}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.COLORS.background,
    zIndex: 9999,
  },
  inlineContainer: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.border,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.COLORS.overlay,
  },
  headerTitle: {
    width: 150,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.COLORS.overlay,
  },
  scrollContent: {
    padding: 20,
    gap: 15,
  },
  card: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarBox: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: THEME.COLORS.overlay,
    marginRight: 15,
  },
  headerTextGroup: {
    flex: 1,
    gap: 8,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.COLORS.overlay,
  },
  lineTitle: {
    width: '60%',
  },
  lineSubtitle: {
    width: '40%',
  },
  contentBlock: {
    height: 60,
    borderRadius: 8,
    backgroundColor: THEME.COLORS.overlay,
    marginBottom: 15,
  },
  buttonLine: {
    height: 40,
    borderRadius: 8,
    backgroundColor: THEME.COLORS.overlay,
  }
});

export default GlobalSkeleton;