// src/components/ui/SmartHeader.jsx
// HEADER INTELLIGENT - Architecture modulaire & Context Aware
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle
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

const SmartHeader = ({ 
  scrollY, 
  address = "Recherche GPS...", 
  userName = "Passager",
  onMenuPress, 
  onNotificationPress,
  onSearchPress,
  onOriginPress,
  isManualOrigin = false,
  onCancelOrigin,
  hasDestination = false,
  onCancelDestination 
}) => {
  const insets = useSafeAreaInsets();
  
  const user = useSelector(selectCurrentUser);
  const isRefreshing = useSelector(selectIsRefreshing);
  const currentRide = useSelector(selectCurrentRide);

  const isRider = user?.role === 'rider';
  const hasActiveRide = !!currentRide;

  const headerMaxHeight = THEME.LAYOUT.HEADER_MAX_HEIGHT + insets.top;
  const headerMinHeight = THEME.LAYOUT.HEADER_HEIGHT + insets.top;
  const scrollDistance = headerMaxHeight - headerMinHeight;

  const isFetchingAddress = address.toLowerCase().includes('recherche');

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(scrollY.value, [0, scrollDistance], [headerMaxHeight, headerMinHeight], Extrapolation.CLAMP);
    const shadowOpacity = interpolate(scrollY.value, [0, scrollDistance], [0.5, 0.8], Extrapolation.CLAMP);
    return { height, shadowOpacity, elevation: shadowOpacity * 20 };
  });

  const ctaAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, scrollDistance * 0.6], [1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, scrollDistance], [0, -15], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }], display: opacity === 0 ? 'none' : 'flex' };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [scrollDistance * 0.7, scrollDistance], [0, 1], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [scrollDistance * 0.5, scrollDistance], [10, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <Animated.View style={[styles.container, headerAnimatedStyle]}>
      
      <View style={[styles.background, { backgroundColor: THEME.COLORS.background }]}>
        {isRider && <LocationSyncGauge isFetching={isFetchingAddress && !isManualOrigin} variant="rider" />}
      </View>

      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        
        <View style={styles.topRow}>
          
          <NotificationBell onPress={onNotificationPress} />

          <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
            <TouchableOpacity 
              style={styles.locationTitleWrapper}
              onPress={onOriginPress}
              disabled={hasActiveRide || !isRider}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isManualOrigin ? "pin" : "location"} 
                size={14} 
                color={isManualOrigin ? THEME.COLORS.champagneGold : THEME.COLORS.textPrimary} 
                style={styles.locationIcon} 
              />
              <Text style={styles.locationTitle} numberOfLines={1}>{address}</Text>
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
                   style={styles.originTouchable}
                   onPress={onOriginPress}
                   disabled={hasActiveRide}
                   activeOpacity={0.7}
                 >
                   <Ionicons 
                     name={isManualOrigin ? "pin" : "location-sharp"} 
                     size={14} 
                     color={isManualOrigin ? THEME.COLORS.textPrimary : THEME.COLORS.champagneGold} 
                   />
                   <Text style={styles.riderAddressText} numberOfLines={1}>{address}</Text>
                   {!hasActiveRide && (
                     <Ionicons name="chevron-down" size={14} color={THEME.COLORS.textSecondary} style={{ marginLeft: 4 }} />
                   )}
                 </TouchableOpacity>

                 {isManualOrigin && !hasActiveRide && (
                   <TouchableOpacity onPress={onCancelOrigin} style={styles.cancelOriginBtn}>
                     <Ionicons name="close-circle" size={18} color={THEME.COLORS.danger} />
                   </TouchableOpacity>
                 )}
               </View>
             )}
          </View>

          {!isRider && (
             <View style={styles.driverGpsBadge}>
                 <LocationSyncGauge isFetching={isFetchingAddress} variant="driver" />
                 <Ionicons name="navigate" size={18} color={THEME.COLORS.champagneGold} />
                 <Text style={styles.gpsText} numberOfLines={1}>{address}</Text>
             </View>
          )}
          
          <View style={styles.actionPillWrapper}>
            {isRider && !hasActiveRide && !hasDestination && (
              <ActionPill mode="primary" text="Commander un taxi" icon="car-sport" onPress={onSearchPress} />
            )}

            {isRider && !hasActiveRide && hasDestination && (
              <ActionPill mode="cancel" text="Annuler la destination" icon="close-circle" onPress={onCancelDestination} />
            )}
          </View>
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
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderWidth: 2.5,
    borderTopWidth: 0,
    borderColor: THEME.COLORS.champagneGold, 
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: THEME.LAYOUT.spacing.md,
    paddingBottom: 28, 
  },
  topRow: {
    height: THEME.LAYOUT.HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    position: 'absolute',
    left: 50,
    right: 50,
    alignItems: 'center',
  },
  locationTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIcon: {
    marginRight: 4,
  },
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
  ctaContainer: {
    marginTop: 0, 
  },
  greetingHeader: {
    marginBottom: 8, 
    minHeight: 40,    
    justifyContent: 'flex-start',
  },
  greetingText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 4,
  },
  riderAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    marginBottom: 4,
  },
  originTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  riderAddressText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
    opacity: 0.9,
    flexShrink: 1,
  },
  cancelOriginBtn: {
    padding: 4,
    marginLeft: 8,
  },
  driverGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: THEME.COLORS.glassSurface,
    paddingVertical: 10, 
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    alignSelf: 'flex-start',
    overflow: 'hidden', 
  },
  gpsText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1, 
  },
  actionPillWrapper: {
    paddingBottom: 4, 
  }
});

// MEMOIZATION STRICTE : On evite les rendus fantomes si les props ne changent pas
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.address === nextProps.address &&
    prevProps.isManualOrigin === nextProps.isManualOrigin &&
    prevProps.hasDestination === nextProps.hasDestination &&
    prevProps.userName === nextProps.userName
  );
};

export default memo(SmartHeader, arePropsEqual);