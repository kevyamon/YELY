// src/components/ui/SmartHeader.jsx
// HEADER INTELLIGENT - Architecture Modulaire & Affichage 2 Lignes Ultra-Précis
// CSCSM Level: Bank Grade (Modularisé < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { selectCurrentUser, selectIsRefreshing } from '../../store/slices/authSlice';
import { selectCurrentRide } from '../../store/slices/rideSlice';
import THEME from '../../theme/theme';
import ActionPill from './ActionPill';
import LocationSyncGauge from './LocationSyncGauge';
import NotificationBell from './NotificationBell';
import SessionRefreshSkeleton from './SessionRefreshSkeleton';

const parseAddressParts = (rawAddress) => {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return { city: 'Position GPS', detail: null };
  }
  const str = rawAddress.trim();
  const match = str.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return {
      city: match[1].trim() || 'Position GPS',
      detail: match[2].trim(),
    };
  }
  return { city: str, detail: null };
};

const SmartHeader = ({ 
  scrollY, 
  address = "Recherche GPS...", 
  userName = "Passager",
  onMenuPress, 
  onNotificationPress,
  onSearchPress,
  onShoppingPress,
  hasDestination = false,
  onCancelDestination,
  onRefreshLocation
}) => {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const isRefreshing = useSelector(selectIsRefreshing);
  const currentRide = useSelector(selectCurrentRide);

  const isRider = user?.role === 'rider' || user?.role === 'passenger' || user?.role === 'seller';
  const hasActiveRide = currentRide && currentRide.type !== 'DELIVERY';

  const headerMaxHeight = THEME.LAYOUT.HEADER_MAX_HEIGHT + insets.top;
  const headerMinHeight = THEME.LAYOUT.HEADER_HEIGHT + insets.top;
  const scrollDistance = headerMaxHeight - headerMinHeight;

  const isFetchingAddress = (address || "").toLowerCase().includes('recherche');
  const { city: primaryCity, detail: locationDetail } = parseAddressParts(address);

  const defaultScrollY = useSharedValue(0);
  const activeScrollY = scrollY || defaultScrollY;

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(activeScrollY.value, [0, scrollDistance], [headerMaxHeight, headerMinHeight], Extrapolation.CLAMP);
    const shadowOpacity = interpolate(activeScrollY.value, [0, scrollDistance], [0.5, 0.8], Extrapolation.CLAMP);
    return { height, shadowOpacity, elevation: shadowOpacity * 20 };
  });

  const ctaAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(activeScrollY.value, [0, scrollDistance * 0.6], [1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(activeScrollY.value, [0, scrollDistance], [0, -15], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }], display: opacity === 0 ? 'none' : 'flex' };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(activeScrollY.value, [scrollDistance * 0.7, scrollDistance], [0, 1], Extrapolation.CLAMP);
    const translateY = interpolate(activeScrollY.value, [scrollDistance * 0.5, scrollDistance], [10, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <Animated.View style={[styles.container, headerAnimatedStyle]}>
      <View style={[styles.background, { backgroundColor: THEME.COLORS.background }]}>
        {isRider && <LocationSyncGauge isFetching={isFetchingAddress} variant="rider" />}
      </View>

      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <NotificationBell onPress={onNotificationPress} />

          <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
            <TouchableOpacity 
              onPress={onRefreshLocation} 
              activeOpacity={0.7} 
              style={styles.locationTitleWrapper} 
              disabled={!onRefreshLocation}
            >
              <Ionicons name="location" size={14} color={THEME.COLORS.textPrimary} style={styles.locationIcon} />
              <Text style={styles.locationTitle} numberOfLines={1}>{primaryCity}</Text>
              {onRefreshLocation && (
                <Ionicons name="sync-outline" size={12} color={THEME.COLORS.textSecondary} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
            <Ionicons name="menu-outline" size={28} color={THEME.COLORS.champagneGold} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.ctaContainer, ctaAnimatedStyle]}>
          <View style={styles.greetingHeader}>
            <SessionRefreshSkeleton 
              isRefreshing={isRefreshing && !user} 
              fallbackText={`Bonjour, ${userName}`}
              textStyle={styles.greetingText}
            />
             
            {isRider && (
              <View style={styles.riderAddressRow}>
                <TouchableOpacity 
                  onPress={onRefreshLocation} 
                  activeOpacity={0.7} 
                  style={styles.originView} 
                  disabled={!onRefreshLocation}
                >
                  <Ionicons 
                    name="location-sharp" 
                    size={14} 
                    color={THEME.COLORS.champagneGold} 
                    style={locationDetail ? { marginTop: 1 } : null}
                  />
                  <View style={styles.addressColumn}>
                    <View style={styles.cityRow}>
                      <Text style={styles.riderCityText} numberOfLines={1}>{primaryCity}</Text>
                      {onRefreshLocation && (
                        <Ionicons name="sync-outline" size={11} color={THEME.COLORS.champagneGold} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    {locationDetail ? (
                      <Text style={styles.riderDetailText} numberOfLines={1}>{locationDetail}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!isRider ? (
            <View style={styles.driverCtaRow}>
              <TouchableOpacity 
                onPress={onRefreshLocation} 
                activeOpacity={0.7} 
                style={styles.driverGpsBadge} 
                disabled={!onRefreshLocation}
              >
                <LocationSyncGauge isFetching={isFetchingAddress} variant="driver" />
                <Ionicons name="navigate" size={18} color={THEME.COLORS.champagneGold} />
                <View style={[styles.addressColumn, { marginLeft: 8 }]}>
                  <Text style={styles.gpsText} numberOfLines={1}>{primaryCity}</Text>
                  {locationDetail && <Text style={styles.gpsDetailText} numberOfLines={1}>{locationDetail}</Text>}
                </View>
                {onRefreshLocation && (
                  <Ionicons name="sync-outline" size={14} color={THEME.COLORS.champagneGold} style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.shoppingBtnSmall} onPress={onShoppingPress}>
                <Ionicons name="cart" size={20} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionPillWrapper}>
              <View style={styles.riderButtonRow}>
                {!hasActiveRide && !hasDestination && (
                  <View style={styles.flexBtn}>
                    <ActionPill 
                      type="taxi" 
                      onPress={onSearchPress} 
                      disabled={false} 
                      activeRideStatus={currentRide?.status} 
                    />
                  </View>
                )}
                {!hasActiveRide && hasDestination && (
                  <View style={styles.flexBtn}>
                    <ActionPill 
                      type="cancel_destination" 
                      onPress={onCancelDestination} 
                      disabled={false} 
                    />
                  </View>
                )}
                {!hasActiveRide && (
                  <View style={[styles.flexBtn, { marginLeft: 10 }]}>
                    <ActionPill 
                      type="shopping" 
                      onPress={onShoppingPress} 
                      disabled={false} 
                    />
                  </View>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
    shadowColor: THEME.COLORS.pureBlack,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 15,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: THEME.BORDERS.radius.headerCurve,
    borderBottomRightRadius: THEME.BORDERS.radius.headerCurve,
    borderBottomWidth: 1.5,
    borderBottomColor: THEME.COLORS.champagneGold,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: THEME.SPACING.md,
    justifyContent: 'space-between',
    paddingBottom: THEME.SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  locationTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  locationIcon: { marginRight: 6 },
  locationTitle: {
    color: THEME.COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 14,
    flexShrink: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  ctaContainer: { marginTop: 0 },
  greetingHeader: {
    marginBottom: 4, 
    minHeight: 38,    
    justifyContent: 'flex-start',
  },
  greetingText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 2,
    marginLeft: 4,
  },
  riderAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    marginBottom: 2,
  },
  originView: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1,
    gap: 4,
  },
  addressColumn: {
    flexShrink: 1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderCityText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    flexShrink: 1,
  },
  riderDetailText: {
    color: 'rgba(212, 175, 55, 0.95)',
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 13,
    marginTop: 1,
    flexShrink: 1,
  },
  driverCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  driverGpsBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingVertical: 8, 
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    overflow: 'hidden', 
  },
  gpsText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  gpsDetailText: {
    color: 'rgba(212, 175, 55, 0.95)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  shoppingBtnSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: THEME.COLORS.champagneGold,
    ...THEME.SHADOWS.gold,
  },
  actionPillWrapper: { paddingBottom: 2 },
  riderButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexBtn: { flex: 1 }
});

const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.address === nextProps.address &&
    prevProps.hasDestination === nextProps.hasDestination &&
    prevProps.userName === nextProps.userName &&
    prevProps.onRefreshLocation === nextProps.onRefreshLocation
  );
};

export default memo(SmartHeader, arePropsEqual);