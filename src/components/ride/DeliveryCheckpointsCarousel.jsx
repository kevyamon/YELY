// src/components/ride/DeliveryCheckpointsCarousel.jsx
// COMPOSANT MODULAIRE - Carrousel Horizontal des Points de Collecte Vendeurs
// CSCSM Level: Bank Grade / Modular Architecture

import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.78, 300);
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

const DeliveryCheckpointsCarousel = ({
  collectionPoints = [],
  onCollectPoint,
  isCollectingPoint = false,
  onOpenGPS,
}) => {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!collectionPoints || collectionPoints.length === 0) return null;

  const totalPoints = collectionPoints.length;
  const collectedCount = collectionPoints.filter((p) => p.isCollected).length;

  const scrollToNext = () => {
    if (activeIndex < totalPoints - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * SNAP_INTERVAL, animated: true });
    }
  };

  const scrollToPrev = () => {
    if (activeIndex > 0) {
      const prevIndex = activeIndex - 1;
      setActiveIndex(prevIndex);
      scrollRef.current?.scrollTo({ x: prevIndex * SNAP_INTERVAL, animated: true });
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index >= 0 && index < totalPoints && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER AVEC FLÈCHES DE NAVIGATION */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="cube" size={16} color={THEME.COLORS.champagneGold} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>
            Collecte Vendeurs ({collectedCount}/{totalPoints})
          </Text>
        </View>

        {totalPoints >= 2 && (
          <View style={styles.navArrowsGroup}>
            <TouchableOpacity
              style={[styles.arrowButton, activeIndex === 0 && styles.arrowButtonDisabled]}
              onPress={scrollToPrev}
              disabled={activeIndex === 0}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={activeIndex === 0 ? THEME.COLORS.textTertiary : THEME.COLORS.champagneGold}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.arrowButton, activeIndex >= totalPoints - 1 && styles.arrowButtonDisabled]}
              onPress={scrollToNext}
              disabled={activeIndex >= totalPoints - 1}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={activeIndex >= totalPoints - 1 ? THEME.COLORS.textTertiary : THEME.COLORS.champagneGold}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CARROUSEL HORIZONTAL FLUIDE */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {collectionPoints.map((item, idx) => {
          const isCollected = item.isCollected;
          const sellerId = item.seller?._id || item.seller;
          const sellerName = item.seller?.name || `Vendeur #${idx + 1}`;
          const sellerAddress = item.seller?.address || item.address || 'Adresse vendeur';

          return (
            <View
              key={idx}
              style={[
                styles.card,
                isCollected && styles.cardCollected,
                activeIndex === idx && styles.cardActive,
              ]}
            >
              {/* TOP CARD BADGE */}
              <View style={styles.cardTopRow}>
                <View style={[styles.badgePoint, isCollected && styles.badgePointCollected]}>
                  <Text style={[styles.badgePointText, isCollected && styles.badgePointTextCollected]}>
                    Point {idx + 1} / {totalPoints}
                  </Text>
                </View>

                {onOpenGPS && item.coordinates && (
                  <TouchableOpacity
                    style={styles.gpsIconBtn}
                    onPress={() => onOpenGPS({ lat: item.coordinates[1], lng: item.coordinates[0] })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="navigate-circle" size={24} color={THEME.COLORS.champagneGold} />
                  </TouchableOpacity>
                )}
              </View>

              {/* VENDEUR INFOS */}
              <Text style={styles.sellerName} numberOfLines={1}>
                {sellerName}
              </Text>
              <Text style={styles.sellerAddress} numberOfLines={2}>
                {sellerAddress}
              </Text>

              {/* ACTION BUTTON */}
              {isCollected ? (
                <View style={styles.collectedStatusBox}>
                  <Ionicons name="checkmark-circle" size={18} color={THEME.COLORS.success} style={{ marginRight: 6 }} />
                  <Text style={styles.collectedStatusText}>Colis Récupéré</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.collectActionBtn}
                  onPress={() => onCollectPoint(sellerId)}
                  disabled={isCollectingPoint}
                  activeOpacity={0.85}
                >
                  {isCollectingPoint ? (
                    <ActivityIndicator size="small" color="#121418" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-sharp" size={16} color="#121418" style={{ marginRight: 6 }} />
                      <Text style={styles.collectActionText}>Valider la récupération</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    color: THEME.COLORS.textPrimary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navArrowsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonDisabled: {
    opacity: 0.3,
    borderColor: THEME.COLORS.border,
  },
  scrollContent: {
    paddingRight: THEME.SPACING.md,
    gap: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.border,
    justifyContent: 'space-between',
  },
  cardActive: {
    borderColor: THEME.COLORS.champagneGold,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  cardCollected: {
    borderColor: 'rgba(46, 204, 113, 0.3)',
    backgroundColor: 'rgba(46, 204, 113, 0.04)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgePoint: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  badgePointCollected: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  badgePointText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.COLORS.champagneGold,
    textTransform: 'uppercase',
  },
  badgePointTextCollected: {
    color: THEME.COLORS.success,
  },
  gpsIconBtn: {
    padding: 2,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
    marginBottom: 2,
  },
  sellerAddress: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  collectActionBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectActionText: {
    color: '#121418',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  collectedStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.25)',
  },
  collectedStatusText: {
    color: THEME.COLORS.success,
    fontSize: 12,
    fontWeight: '800',
  },
});

export default DeliveryCheckpointsCarousel;
