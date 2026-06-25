// src/screens/home/SellerHome.jsx
// HOME SELLER - Orchestrateur Business & Mobilité
// CSCSM Level: Bank Grade

import React, { memo, useState, useRef, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Share,
  Linking,
  Platform,
  Alert
} from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';

import SmartHeader from '../../components/ui/SmartHeader';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';

import { selectCurrentUser, logout, selectSubscriptionStatus, selectPromoMode, selectIsSubscriptionModalDismissed } from '../../store/slices/authSlice';
import ShopLocationModal from '../../components/ui/ShopLocationModal';
import { useGetMyProductsQuery, useGetLedgerStatsQuery } from '../../store/api/marketplaceApiSlice';
import THEME from '../../theme/theme';
import ENV from '../../config/env';
import useGeolocation from '../../hooks/useGeolocation';
import MapService from '../../services/mapService';
import { selectLastAddress, updateAddress } from '../../store/slices/locationSlice';
import { showToast } from '../../store/slices/uiSlice';

const SellerHome = ({ navigation }) => {
  const scrollY = useSharedValue(0);
  const user = useSelector(selectCurrentUser);
  const lastKnownAddress = useSelector(selectLastAddress);
  const dispatch = useDispatch();
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const subStatus = useSelector(selectSubscriptionStatus);
  const promoMode = useSelector(selectPromoMode);
  const isSubscriptionModalDismissed = useSelector(selectIsSubscriptionModalDismissed);
  const isFocused = useIsFocused();

  const isActive = subStatus?.isActive === true;
  const isPending = subStatus?.isPending === true;
  const isBlocked = !isActive && !promoMode?.isActive;

  React.useEffect(() => {
    if (isFocused && !isSubscriptionModalDismissed) {
      if (isBlocked) {
        if (isPending) {
          navigation.navigate('WaitSubscription');
        } else if (subStatus?.isRejected) {
          navigation.navigate('PaymentFailure');
        } else {
          navigation.navigate('Subscription');
        }
      }
    }
  }, [isFocused, isBlocked, isPending, subStatus?.isRejected, isSubscriptionModalDismissed, navigation]);

  const renderSubscriptionBanner = () => {
    if (isActive || promoMode?.isActive) return null;

    return (
      <TouchableOpacity 
        style={[
          styles.bannerContainer, 
          isPending ? styles.bannerPending : styles.bannerBlocked
        ]} 
        onPress={() => {
          const { setSubscriptionModalDismissed } = require('../../store/slices/authSlice');
          dispatch(setSubscriptionModalDismissed(false));
          if (isPending) {
            navigation.navigate('WaitSubscription');
          } else if (subStatus?.isRejected) {
            navigation.navigate('PaymentFailure');
          } else {
            navigation.navigate('Subscription');
          }
        }}
        activeOpacity={0.9}
      >
        <View style={styles.bannerLeft}>
          <Ionicons 
            name={isPending ? "time-outline" : "warning-outline"} 
            size={20} 
            color={isPending ? "#000" : "#FFF"} 
          />
          <Text style={[styles.bannerText, isPending && { color: '#000' }]} numberOfLines={2}>
            {isPending 
              ? "Paiement en attente de validation... [Détails]" 
              : "Abonnement expiré. Vos fonctions de vente sont désactivées. [S'abonner]"
            }
          </Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={isPending ? "#000" : "#FFF"} 
        />
      </TouchableOpacity>
    );
  };

  const isLocationSet = user?.currentLocation?.coordinates && 
    !(user.currentLocation.coordinates[0] === 0 && user.currentLocation.coordinates[1] === 0);

  const baseUrl = ENV.API_URL && (ENV.API_URL.includes('localhost') || ENV.API_URL.includes('192.168.'))
    ? ENV.API_URL.replace('/api/v1', '')
    : 'https://yely-amber.vercel.app';
  const shareUrl = user ? `${baseUrl}/shop/${user.shopSlug || user._id}` : '';
  const qrCodeUrl = user ? `https://quickchart.io/qr?text=${encodeURIComponent(shareUrl)}&centerImageUrl=${encodeURIComponent('https://download-yely.vercel.app/logo.png')}&centerImageSizeRatio=0.22&ecLevel=H&size=250` : '';
  const shareUrlWithBuster = useMemo(() => shareUrl ? `${shareUrl}?v=${Date.now()}` : '', [shareUrl]);

  const handleShare = async () => {
    try {
      let shared = false;
      if (Platform.OS === 'web') {
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Boutique Yely de ${user?.name || 'Vendeur'}`,
              text: `Decouvrez ma boutique sur Yely ! Visitez mes produits ici :`,
              url: shareUrlWithBuster,
            });
            shared = true;
          } catch (e) {
            // User cancelled
          }
        }

        if (!shared) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
          }
          dispatch(showToast({
            type: 'success',
            title: 'Lien copie',
            message: 'Le lien de votre boutique a ete copie dans le presse-papier.'
          }));
        }
      } else {
        await Share.share({
          message: `Decouvrez ma boutique sur Yely ! Visitez mes produits ici :\n\n${shareUrlWithBuster}`,
          url: shareUrlWithBuster,
          title: `Boutique de ${user?.name || 'Vendeur'}`
        });
      }
    } catch (error) {
      console.warn('Share error:', error.message);
    }
  };

  const handleDownloadQrCode = async () => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yely-shop-${user?._id || 'qr'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        dispatch(showToast({
          type: 'success',
          title: 'Telechargement',
          message: 'Code QR telecharge avec succes.'
        }));
      } else {
        const supported = await Linking.canOpenURL(qrCodeUrl);
        if (supported) {
          await Linking.openURL(qrCodeUrl);
        } else {
          Alert.alert('Erreur', 'Impossible de generer le code QR.');
        }
      }
    } catch (err) {
      console.warn('QR download error:', err);
      dispatch(showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de telecharger le code QR.'
      }));
    }
  };

  // ─── GEOLOCATION LOGIC ───
  const { location } = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState(lastKnownAddress || 'Recherche...');
  const lastGeocodedLocationRef = useRef(null);

  React.useEffect(() => {
    if (location) {
      let shouldFetch = false;

      if (!lastGeocodedLocationRef.current) {
        shouldFetch = true;
      } else {
        const distance = MapService.calculateDistance(
          { latitude: location.latitude, longitude: location.longitude },
          lastGeocodedLocationRef.current
        );
        // On ne recalcule l'adresse que si on a bougé de plus de 50m
        if (distance > 50) {
          shouldFetch = true;
        }
      }

      if (shouldFetch) {
        lastGeocodedLocationRef.current = {
          latitude: location.latitude,
          longitude: location.longitude
        };

        MapService.getAddressFromCoordinates(location.latitude, location.longitude)
          .then(addr => {
            setCurrentAddress(addr);
            dispatch(updateAddress(addr));
          })
          .catch(() => setCurrentAddress('Position inconnue'));
      }
    }
  }, [location, dispatch]);

  // ─── DATA FETCHING ───
  const { data: productsData, isLoading: isLoadingProducts } = useGetMyProductsQuery();
  const { data: statsData, isLoading: isLoadingStats } = useGetLedgerStatsQuery();

  const productCount = productsData?.data?.length || productsData?.length || 0;
  const totalSales = statsData?.data?.totalEarnings || statsData?.totalEarnings || 0;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleGoToManageProducts = () => {
    requestAnimationFrame(() => {
      navigation.navigate('ManageProducts');
    });
  };
  const handleGoToOrders = () => {
    requestAnimationFrame(() => {
      navigation.navigate('SellerOrders');
    });
  };
  const handleGoToMarketplace = () => {
    requestAnimationFrame(() => {
      navigation.navigate('MarketplaceHub');
    });
  };
  const handleGoToTaxi = () => {
    requestAnimationFrame(() => {
      navigation.navigate('RiderHome');
    });
  };

  return (
    <View style={styles.screenWrapper}>
      {user && !isLocationSet ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={styles.blockingContent}>
            <View style={styles.blockingIconBg}>
              <MaterialCommunityIcons name="storefront-remove" size={44} color={THEME.COLORS.danger} />
            </View>
            <Text style={styles.blockingTitle}>Configuration requise</Text>
            <Text style={styles.blockingDescription}>
              Pour continuer à utiliser votre espace vendeur et recevoir des commandes, vous devez obligatoirement définir l'emplacement géographique de votre boutique.
            </Text>
            <Text style={styles.blockingSubDescription}>
              Cette information permettra d'estimer précisément les frais de livraison et de planifier les itinéraires des livreurs partenaires.
            </Text>
            <TouchableOpacity 
              style={styles.blockingBtn}
              onPress={() => setIsLocationModalVisible(true)}
            >
              <MaterialCommunityIcons name="map-marker-radius" size={20} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.blockingBtnText}>Configurer l'emplacement de ma boutique</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.blockingLogoutBtn}
              onPress={() => dispatch(logout({ reason: 'USER_INITIATED' }))}
            >
              <Text style={styles.blockingLogoutBtnText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <SmartHeader
            scrollY={scrollY}
            address={currentAddress}
            userName={user?.name?.split(' ')[0] || "Vendeur"}
            onMenuPress={() => navigation.navigate('Menu')}
            onNotificationPress={() => navigation.navigate('Notifications')}
            onSearchPress={handleGoToTaxi}
          />

          <Animated.ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >
            <View style={styles.spacer} />

            {/* BANNER D'ABONNEMENT */}
            {renderSubscriptionBanner()}

            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Ma Boutique</Text>
              <Text style={styles.welcomeSubtitle}>Gérez vos ventes et vos déplacements.</Text>
            </View>

            <View style={styles.statsRow}>
              <GlassCard style={styles.statCard}>
                <Ionicons name="cube-outline" size={24} color={THEME.COLORS.primary} />
                {isLoadingProducts ? (
                  <ActivityIndicator size="small" color={THEME.COLORS.primary} style={{ marginTop: 8 }} />
                ) : (
                  <Text style={styles.statValue}>{productCount}</Text>
                )}
                <Text style={styles.statLabel}>Produits</Text>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Ionicons name="cash-outline" size={24} color={THEME.COLORS.success || '#27ae60'} />
                {isLoadingStats ? (
                  <ActivityIndicator size="small" color={THEME.COLORS.primary} style={{ marginTop: 8 }} />
                ) : (
                  <Text style={styles.statValue}>{totalSales.toLocaleString()} FCFA</Text>
                )}
                <Text style={styles.statLabel}>Ventes</Text>
              </GlassCard>
            </View>

            {/* Localisation de ma boutique */}
            {user && (
              <TouchableOpacity 
                style={styles.shareShopCard} 
                onPress={() => setIsLocationModalVisible(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.01)']}
                  style={styles.shareShopGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.shareShopLeft}>
                    <View style={[styles.shareShopIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <MaterialCommunityIcons name="storefront-outline" size={20} color="#10B981" />
                    </View>
                    <View style={styles.shareShopTextContainer}>
                      <Text style={styles.shareShopTitle}>Localisation de ma boutique</Text>
                      <Text style={styles.shareShopSubtitle} numberOfLines={1}>
                        {user.address || 'Position configurée avec succès'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="pencil" size={16} color="#10B981" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Promotion / Share Shop Card */}
            {user && (
              <TouchableOpacity
                style={[styles.shareShopCard, { marginTop: THEME.SPACING.xs }]}
                onPress={() => setIsShareModalVisible(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(212, 175, 55, 0.08)', 'rgba(212, 175, 55, 0.01)']}
                  style={styles.shareShopGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.shareShopLeft}>
                    <View style={styles.shareShopIconBg}>
                      <MaterialCommunityIcons name="qrcode-scan" size={20} color={THEME.COLORS.primary} />
                    </View>
                    <View style={styles.shareShopTextContainer}>
                      <Text style={styles.shareShopTitle}>Partager ma boutique</Text>
                      <Text style={styles.shareShopSubtitle}>Lien de partage & code QR a imprimer</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="share-variant" size={20} color={THEME.COLORS.primary} />
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.mainActionCard} onPress={handleGoToManageProducts}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="add-circle" size={32} color={THEME.COLORS.textInverse} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Gérer mes produits</Text>
                <Text style={styles.actionDesc}>Ajouter, modifier ou supprimer vos articles.</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={THEME.COLORS.primary} />
            </TouchableOpacity>

            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Actions rapides</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.smallActionCard} onPress={handleGoToOrders}>
                  <Ionicons name="receipt" size={24} color={THEME.COLORS.primary} />
                  <Text numberOfLines={1} style={styles.smallActionLabel}>Commandes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.smallActionCard} onPress={() => navigation.navigate('History')}>
                  <Ionicons name="stats-chart" size={24} color={THEME.COLORS.primary} />
                  <Text numberOfLines={1} style={styles.smallActionLabel}>Historique</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.smallActionCard} onPress={() => navigation.navigate('RiderHome')}>
                  <Ionicons name="car-sport" size={24} color={THEME.COLORS.primary} />
                  <Text numberOfLines={1} style={styles.smallActionLabel}>Taxi</Text>
                </TouchableOpacity>
              </View>
            </View>

            <GoldButton
              title="ACCÉDER AU MARCHÉ"
              icon="cart"
              onPress={handleGoToMarketplace}
              style={styles.bottomBtn}
            />

          </Animated.ScrollView>
        </>
      )}

      {/* SHARE MODAL WITH QR CODE */}
      <Modal
        visible={isShareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsShareModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Partager ma boutique</Text>
              <TouchableOpacity onPress={() => setIsShareModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} />
            </View>

            <Text style={styles.shareDescription}>
              Scannez ce QR Code ou partagez le lien ci-dessous pour diriger directement vos clients vers votre boutique Yely.
            </Text>

            <TouchableOpacity style={styles.shareLinkBox} onPress={handleShare} activeOpacity={0.7}>
              <Text style={styles.shareLinkText} numberOfLines={1}>{shareUrl}</Text>
              <MaterialCommunityIcons name="share-variant" size={20} color={THEME.COLORS.primary} />
            </TouchableOpacity>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity style={styles.modalDownloadBtn} onPress={handleDownloadQrCode}>
                <MaterialCommunityIcons name="download" size={16} color={THEME.COLORS.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.modalDownloadBtnText}>Telecharger QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalShareBtn} onPress={handleShare}>
                <Text style={styles.modalShareBtnText}>Envoyer le lien</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {user && (
        <ShopLocationModal
          visible={isLocationModalVisible}
          onClose={() => setIsLocationModalVisible(false)}
          initialCoords={user.currentLocation?.coordinates}
          initialAddress={user.address}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  spacer: { height: 240 },
  welcomeSection: { marginBottom: 25 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: THEME.COLORS.textPrimary, letterSpacing: 0.5 },
  welcomeSubtitle: { fontSize: 16, color: THEME.COLORS.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 12, color: THEME.COLORS.textSecondary, marginTop: 4, textTransform: 'uppercase' },
  mainActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    marginBottom: 25,
    ...THEME.SHADOWS.md
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: THEME.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionTextContainer: { flex: 1, marginLeft: 15 },
  actionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  actionDesc: { fontSize: 14, color: THEME.COLORS.textSecondary, marginTop: 2 },
  quickActionsContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 15 },
  actionsGrid: { flexDirection: 'row', gap: 15 },
  smallActionCard: {
    flex: 1,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  smallActionLabel: { fontSize: 11, fontWeight: '600', color: THEME.COLORS.textPrimary, marginTop: 8, textAlign: 'center' },
  bottomBtn: { marginTop: 10 },

  blockingContent: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: THEME.COLORS.glassModal || 'rgba(30, 30, 30, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    padding: THEME.SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  blockingIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  blockingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  blockingDescription: {
    fontSize: 13.5,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  blockingSubDescription: {
    fontSize: 11.5,
    color: THEME.COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 24,
  },
  blockingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.primary,
    borderRadius: THEME.BORDERS.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    ...THEME.SHADOWS.gold,
    marginBottom: 16,
  },
  blockingBtnText: {
    color: THEME.COLORS.deepAsphalt || '#121418',
    fontWeight: '900',
    fontSize: 13,
  },
  blockingLogoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  blockingLogoutBtnText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  // Styles de partage de boutique
  shareShopCard: {
    marginTop: THEME.SPACING.xs,
    marginBottom: THEME.SPACING.lg,
    borderRadius: THEME.BORDERS.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(214, 175, 55, 0.2)',
  },
  shareShopGradient: {
    padding: THEME.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareShopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.md,
  },
  shareShopIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(214, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareShopTextContainer: {
    justifyContent: 'center',
  },
  shareShopTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
  },
  shareShopSubtitle: {
    fontSize: 11,
    color: THEME.COLORS.textSecondary,
    marginTop: 2,
  },

  // Modale de partage
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME.COLORS.glassModal || 'rgba(30, 30, 30, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    width: '88%',
    maxWidth: 360,
    padding: THEME.SPACING.xl,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: THEME.SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: THEME.SPACING.md,
  },
  qrCode: {
    width: 180,
    height: 180,
  },
  shareDescription: {
    fontSize: 11,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: THEME.SPACING.md,
  },
  shareLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: THEME.SPACING.lg,
  },
  shareLinkText: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
    flex: 1,
    marginRight: 8,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  modalDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDownloadBtnText: {
    color: THEME.COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 12.5,
  },
  modalShareBtn: {
    flex: 1,
    backgroundColor: THEME.COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.SHADOWS.goldSoft,
  },
  modalShareBtnText: {
    color: THEME.COLORS.deepAsphalt || '#121418',
    fontWeight: '800',
    fontSize: 12.5,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bannerPending: {
    backgroundColor: '#FFCC00', // Jaune attention
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bannerBlocked: {
    backgroundColor: '#E74C3C', // Rouge danger
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 10,
  }
});

export default memo(SellerHome);
