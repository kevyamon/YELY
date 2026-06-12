import React, { useState, useRef, useMemo } from 'react';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  useColorScheme,
  Image,
  Modal,
  Share,
  Linking,
  Platform
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logout } from '../../store/slices/authSlice';
import { 
  useGetSellerOrdersQuery, 
  useUpdateOrderStatusMutation,
  useGetLedgerStatsQuery 
} from '../../store/api/marketplaceApiSlice';
import { showSuccessToast, showErrorToast, showToast } from '../../store/slices/uiSlice';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ShopLocationModal from '../../components/ui/ShopLocationModal';
import THEME from '../../theme/theme';
import ENV from '../../config/env';

const SellerDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('pending');
  const currentUser = useSelector(selectCurrentUser);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef(null);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const baseUrl = ENV.API_URL && (ENV.API_URL.includes('localhost') || ENV.API_URL.includes('192.168.'))
    ? ENV.API_URL.replace('/api/v1', '')
    : 'https://yely-amber.vercel.app';
  const shareUrl = currentUser ? `${baseUrl}/shop/${currentUser.shopSlug || currentUser._id}` : '';
  const qrCodeUrl = currentUser ? `https://quickchart.io/qr?text=${encodeURIComponent(shareUrl)}&centerImageUrl=${encodeURIComponent('https://download-yely.vercel.app/logo.png')}&centerImageSizeRatio=0.22&ecLevel=H&size=250` : '';
  const shareUrlWithBuster = useMemo(() => shareUrl ? `${shareUrl}?v=${Date.now()}` : '', [shareUrl]);

  const handleShare = async () => {
    try {
      let shared = false;
      if (Platform.OS === 'web') {
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Boutique Yély de ${currentUser?.name || 'Vendeur'}`,
              text: `Découvrez ma boutique sur Yély ! Visitez mes produits ici :`,
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
            title: 'Lien copié',
            message: 'Le lien de votre boutique a été copié dans le presse-papier.'
          }));
        }
      } else {
        await Share.share({
          message: `Découvrez ma boutique sur Yély ! Visitez mes produits ici :\n\n${shareUrlWithBuster}`,
          url: shareUrlWithBuster,
          title: `Boutique de ${currentUser?.name || 'Vendeur'}`
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
        a.download = `yely-shop-${currentUser?._id || 'qr'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        dispatch(showToast({
          type: 'success',
          title: 'Téléchargement',
          message: 'Code QR téléchargé avec succès.'
        }));
      } else {
        const supported = await Linking.canOpenURL(qrCodeUrl);
        if (supported) {
          await Linking.openURL(qrCodeUrl);
        } else {
          Alert.alert('Erreur', 'Impossible de générer le code QR.');
        }
      }
    } catch (err) {
      console.warn('QR download error:', err);
      dispatch(showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de télécharger le code QR.'
      }));
    }
  };

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const { data: ordersData, isLoading, refetch } = useGetSellerOrdersQuery();
  const { data: ledgerData } = useGetLedgerStatsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [confirmData, setConfirmData] = React.useState({ visible: false, orderId: null, nextStatus: '', msg: '' });

  const isLocationSet = currentUser?.currentLocation?.coordinates && 
    !(currentUser.currentLocation.coordinates[0] === 0 && currentUser.currentLocation.coordinates[1] === 0);



  const orders = ordersData?.data || [];
  const filteredOrders = orders.filter(o => o.status === activeTab);

  const handleUpdateStatus = async (orderId, currentStatus) => {
    let nextStatus = '';
    let confirmMsg = '';

    if (currentStatus === 'pending') {
      nextStatus = 'confirmed';
      confirmMsg = 'Voulez-vous confirmer cette commande et commencer la préparation ?';
    } else if (currentStatus === 'confirmed') {
      nextStatus = 'picked_up';
      confirmMsg = 'Le colis a-t-il été remis au livreur ?';
    } else if (currentStatus === 'picked_up') {
      nextStatus = 'delivered';
      confirmMsg = 'Confirmez-vous que la commande a été livrée et payée ?';
    }

    if (!nextStatus) return;

    setConfirmData({
      visible: true,
      orderId,
      nextStatus,
      msg: confirmMsg
    });
  };

  const confirmStatusUpdate = async () => {
    try {
      await updateStatus({ id: confirmData.orderId, status: confirmData.nextStatus }).unwrap();
      showSuccessToast({ title: 'Succès', message: `Commande mise à jour.` });
      setConfirmData({ ...confirmData, visible: false });
      refetch();
    } catch (error) {
      showErrorToast({ message: error.data?.message || 'Action impossible' });
      setConfirmData({ ...confirmData, visible: false });
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <Text style={styles.orderTotal}>{item.totalPrice} FCFA</Text>
      </View>
      
      <View style={styles.itemsList}>
        {item.items.map((it, idx) => (
          <Text key={idx} style={styles.itemText}>{it.quantity}x {it.product?.name || it.name}</Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.customerBox}>
          <MaterialCommunityIcons name="account-outline" size={14} color={THEME.COLORS.textTertiary} />
          <Text style={styles.customerName}>{item.customer?.name || 'Client Yely'}</Text>
        </View>

        {item.status !== 'delivered' && item.status !== 'cancelled' && (
          <TouchableOpacity 
            style={[styles.statusBtn, { backgroundColor: item.status === 'pending' ? THEME.COLORS.primary : THEME.COLORS.success }]} 
            onPress={() => handleUpdateStatus(item._id, item.status)}
            disabled={isUpdating}
          >
            <Text style={styles.statusBtnText}>
              {item.status === 'pending' ? 'PRÉPARER' : 
               item.status === 'confirmed' ? 'REMIS AU LIVREUR' : 
               item.status === 'picked_up' ? 'MARQUER LIVRÉ' : 'OK'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      {currentUser && !isLocationSet ? (
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
          <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')} style={styles.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          {currentUser && (
            <TouchableOpacity 
              style={styles.manageProductsBtn} 
              onPress={() => navigation.navigate('SellerProfile', { sellerId: currentUser._id })}
            >
              <MaterialCommunityIcons name="storefront" size={20} color={THEME.COLORS.primary} />
              <Text style={styles.manageBtnText}>Ma Boutique</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.manageProductsBtn, { marginLeft: 8 }]} 
            onPress={() => navigation.navigate('ManageProducts')}
          >
            <MaterialCommunityIcons name="package-variant-closed" size={20} color={THEME.COLORS.primary} />
            <Text style={styles.manageBtnText}>Produits</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Ledger */}
      <View style={styles.ledgerCard}>
        <View style={styles.ledgerInfo}>
          <Text style={styles.ledgerLabel}>Cash à récupérer</Text>
          <Text style={styles.ledgerValue}>{ledgerData?.data?.totalPending || 0} FCFA</Text>
        </View>
        <TouchableOpacity style={styles.ledgerBtn} onPress={() => navigation.navigate('LedgerHistory')}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Configuration Localisation Boutique */}
      {currentUser && (() => {
        const isLocationSet = currentUser?.currentLocation?.coordinates && 
          !(currentUser.currentLocation.coordinates[0] === 0 && currentUser.currentLocation.coordinates[1] === 0);

        return !isLocationSet ? (
          <TouchableOpacity 
            style={[styles.locationWarningCard]} 
            onPress={() => setIsLocationModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(231, 76, 60, 0.15)', 'rgba(231, 76, 60, 0.03)']}
              style={styles.locationWarningGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.shareShopLeft}>
                <View style={[styles.shareShopIconBg, { backgroundColor: 'rgba(231, 76, 60, 0.2)' }]}>
                  <MaterialCommunityIcons name="map-marker-alert-outline" size={22} color={THEME.COLORS.danger} />
                </View>
                <View style={styles.shareShopTextContainer}>
                  <Text style={[styles.shareShopTitle, { color: THEME.COLORS.danger }]}>Localisation requise ⚠️</Text>
                  <Text style={styles.shareShopSubtitle}>Définissez la position pour recevoir des commandes</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.COLORS.danger} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
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
                    {currentUser.address || 'Position configurée avec succès'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="pencil" size={16} color="#10B981" />
            </LinearGradient>
          </TouchableOpacity>
        );
      })()}

      {/* Promotion / Share Shop Card */}
      {currentUser && (
        <TouchableOpacity 
          style={[styles.shareShopCard, { marginTop: THEME.SPACING.md }]} 
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
                <Text style={styles.shareShopSubtitle}>Lien de partage & code QR à imprimer</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="share-variant" size={20} color={THEME.COLORS.primary} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Tabs / Filter Navigation */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {[
            { id: 'pending', label: 'Nouvelles', icon: 'bell-outline' },
            { id: 'confirmed', label: 'En prépa', icon: 'stove' },
            { id: 'picked_up', label: 'En route', icon: 'moped' },
            { id: 'delivered', label: 'Livrées', icon: 'check-all' }
          ].map(tab => {
            const count = orders.filter(o => o.status === tab.id).length;
            const isActive = activeTab === tab.id;

            return (
              <TouchableOpacity 
                key={tab.id} 
                style={[styles.tabPill, isActive && styles.activeTabPill]}
                onPress={() => setActiveTab(tab.id)}
              >
                <MaterialCommunityIcons 
                  name={tab.icon} 
                  size={16} 
                  color={isActive ? THEME.COLORS.deepAsphalt : THEME.COLORS.textTertiary} 
                />
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.badge, isActive && styles.activeBadge]}>
                    <Text style={[styles.badgeText, isActive && styles.activeBadgeText]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={item => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={THEME.COLORS.textTertiary} />
              <Text style={styles.emptyText}>Aucune commande ici</Text>
            </View>
          )}
        />
      )}
    </>
  )}

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      <ConfirmModal 
        visible={confirmData.visible}
        onClose={() => setConfirmData({ ...confirmData, visible: false })}
        onConfirm={confirmStatusUpdate}
        isLoading={isUpdating}
        title="Mise à jour statut"
        message={confirmData.msg}
      />

      {currentUser && (
        <ShopLocationModal
          visible={isLocationModalVisible}
          onClose={() => setIsLocationModalVisible(false)}
          initialCoords={currentUser.currentLocation?.coordinates}
          initialAddress={currentUser.address}
        />
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
              Scannez ce QR Code ou partagez le lien ci-dessous pour diriger directement vos clients vers votre boutique Yély.
            </Text>

            <TouchableOpacity style={styles.shareLinkBox} onPress={handleShare} activeOpacity={0.7}>
              <Text style={styles.shareLinkText} numberOfLines={1}>{shareUrl}</Text>
              <MaterialCommunityIcons name="share-variant" size={20} color={THEME.COLORS.primary} />
            </TouchableOpacity>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity style={styles.modalDownloadBtn} onPress={handleDownloadQrCode}>
                <MaterialCommunityIcons name="download" size={16} color={THEME.COLORS.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.modalDownloadBtnText}>Télécharger QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalShareBtn} onPress={handleShare}>
                <Text style={styles.modalShareBtnText}>Envoyer le lien</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBtn: {
    marginRight: THEME.SPACING.md,
  },
  title: {
    fontSize: THEME.FONTS.sizes.h2,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  manageProductsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.BORDERS.radius.pill,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  manageBtnText: {
    color: THEME.COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ledgerCard: {
    marginHorizontal: THEME.SPACING.xl,
    backgroundColor: THEME.COLORS.primary,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...THEME.SHADOWS.gold,
  },
  ledgerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: THEME.FONTS.sizes.micro,
    textTransform: 'uppercase',
  },
  tabsContainer: {
    marginVertical: THEME.SPACING.lg,
  },
  tabsScroll: {
    paddingHorizontal: THEME.SPACING.xl,
    gap: THEME.SPACING.sm,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  activeTabPill: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
    ...THEME.SHADOWS.gold,
  },
  tabLabel: {
    fontSize: 13,
    color: THEME.COLORS.textTertiary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activeTabLabel: {
    color: THEME.COLORS.deepAsphalt,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  activeBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  badgeText: {
    fontSize: 10,
    color: THEME.COLORS.textSecondary,
    fontWeight: 'bold',
  },
  activeBadgeText: {
    color: THEME.COLORS.deepAsphalt,
  },
  listContent: {
    paddingHorizontal: THEME.SPACING.xl,
  },
  orderCard: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.lg,
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.SPACING.sm,
  },
  orderId: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  orderTotal: {
    fontSize: THEME.FONTS.sizes.body,
    color: THEME.COLORS.primary,
    fontWeight: THEME.FONTS.weights.bold,
  },
  itemsList: {
    marginBottom: THEME.SPACING.md,
  },
  itemText: {
    fontSize: THEME.FONTS.sizes.bodySmall,
    color: THEME.COLORS.textSecondary,
  },
  orderTime: {
    fontSize: 10,
    color: THEME.COLORS.textTertiary,
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border,
    paddingTop: THEME.SPACING.md,
  },
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerName: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    ...THEME.SHADOWS.soft,
  },
  statusBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: THEME.SPACING.md,
    color: THEME.COLORS.textTertiary,
  },

  // Styles de partage de boutique
  locationWarningCard: {
    marginHorizontal: THEME.SPACING.xl,
    marginTop: THEME.SPACING.md,
    borderRadius: THEME.BORDERS.radius.lg,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  locationWarningGradient: {
    padding: THEME.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockingContent: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: THEME.COLORS.glassModal,
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
    color: THEME.COLORS.deepAsphalt,
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
  shareShopCard: {
    marginHorizontal: THEME.SPACING.xl,
    marginTop: THEME.SPACING.md,
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
    backgroundColor: THEME.COLORS.glassModal,
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
    color: THEME.COLORS.deepAsphalt,
    fontWeight: '800',
    fontSize: 12.5,
  }
});

export default SellerDashboard;
