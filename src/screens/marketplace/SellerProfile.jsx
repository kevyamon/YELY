// src/screens/marketplace/SellerProfile.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Modal,
  Share,
  StatusBar,
  useColorScheme
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useGetSellerProfileQuery, useGetProductsQuery } from '../../store/api/marketplaceApiSlice';
import ProductCard from '../../components/marketplace/ProductCard';
import GlobalSkeleton, { SkeletonBone } from '../../components/ui/GlobalSkeleton';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

const SellerProfile = ({ route, navigation }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  const { sellerId } = route.params || {};
  const currentUser = useSelector(selectCurrentUser);
  const isOwnProfile = currentUser && currentUser._id === sellerId;

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  // Fetch Seller Profile
  const { data: profileResponse, isLoading: isProfileLoading, isError: isProfileError } = useGetSellerProfileQuery(sellerId);
  const seller = profileResponse?.data;

  // Fetch Products of this Seller
  const { data: productsResponse, isLoading: isProductsLoading, refetch, isFetching } = useGetProductsQuery({ seller: sellerId });
  const allProducts = productsResponse?.data || [];
  const activeProducts = useMemo(() => allProducts.filter(p => p.isActive), [allProducts]);

  const cardWidth = (width - THEME.SPACING.lg * 2 - 12) / 2;

  const shareUrl = `https://yely-backend-yzw4.onrender.com/api/v1/users/sellers/${sellerId}/share`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ma boutique sur Yély ! Visitez mes produits ici : ${shareUrl}`,
        url: shareUrl,
        title: `Boutique de ${seller?.name || 'Vendeur'}`
      });
    } catch (error) {
      console.warn('Share error:', error.message);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Profil details */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          {seller?.profilePicture ? (
            <Image source={{ uri: seller.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="storefront" size={40} color={THEME.COLORS.primary} />
            </View>
          )}
          <View style={styles.verifiedBadge}>
            <MaterialCommunityIcons name="check-decagram" size={20} color="#D4AF37" />
          </View>
        </View>
        
        <Text style={styles.sellerName}>{seller?.name || 'Boutique'}</Text>
        
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#D4AF37" />
          <Text style={styles.ratingText}>{seller?.rating ? seller.rating.toFixed(1) : '5.0'} / 5</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.productCountText}>{activeProducts.length} articles</Text>
        </View>

        <View style={styles.contactRow}>
          <Text style={styles.contactText} numberOfLines={1}>{seller?.email}</Text>
          {seller?.phone && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.contactText}>{seller.phone}</Text>
            </>
          )}
        </View>

        {isOwnProfile && (
          <TouchableOpacity style={styles.shareBtn} onPress={() => setIsShareModalVisible(true)}>
            <MaterialCommunityIcons name="qrcode" size={20} color={THEME.COLORS.deepAsphalt} />
            <Text style={styles.shareBtnText}>Partager ma boutique</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>Tous les articles</Text>
    </View>
  );

  const renderSkeleton = () => (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.skeletonHeader}>
        <SkeletonBone width={100} height={100} borderRadius={50} style={{ alignSelf: 'center' }} />
        <SkeletonBone width={150} height={20} borderRadius={4} style={{ alignSelf: 'center', marginTop: 15 }} />
        <SkeletonBone width={200} height={15} borderRadius={4} style={{ alignSelf: 'center', marginTop: 10 }} />
      </View>
      <View style={styles.skeletonGrid}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.skeletonCard}>
            <SkeletonBone width="100%" height={130} borderRadius={16} />
            <SkeletonBone width="70%" height={15} style={{ marginTop: 10 }} />
          </View>
        ))}
      </View>
    </View>
  );

  if (isProfileLoading) {
    return renderSkeleton();
  }

  if (isProfileError || !seller) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#000000' : '#F8F9FA' }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color={THEME.COLORS.danger} />
        <Text style={styles.errorText}>Profil vendeur introuvable ou inactif</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Retourner à la marketplace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#F8F9FA' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* TOP NAVIGATION BAR */}
      <View style={[styles.navBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBackBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{seller.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={activeProducts}
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            cardWidth={cardWidth}
            onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
          />
        )}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isFetching}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="storefront-outline" size={60} color={THEME.COLORS.textTertiary} />
            <Text style={styles.emptyText}>Aucun article disponible dans cette boutique.</Text>
          </View>
        }
      />

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

            <TouchableOpacity style={styles.modalShareBtn} onPress={handleShare}>
              <Text style={styles.modalShareBtnText}>Envoyer le lien de la boutique</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.md,
    paddingBottom: THEME.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: THEME.SPACING.md,
  },
  headerContainer: {
    paddingTop: THEME.SPACING.md,
    paddingBottom: THEME.SPACING.sm,
  },
  profileCard: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 20,
    padding: THEME.SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
    ...THEME.SHADOWS.soft,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: THEME.SPACING.sm,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: THEME.COLORS.primary,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(214, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.COLORS.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#000000',
    borderRadius: 10,
    padding: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary,
    marginLeft: 4,
  },
  separator: {
    fontSize: 13,
    color: THEME.COLORS.textTertiary,
    marginHorizontal: 8,
  },
  productCountText: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.COLORS.textSecondary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: THEME.SPACING.md,
  },
  contactText: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: THEME.BORDERS.radius.pill,
    marginTop: 15,
    gap: 8,
    ...THEME.SHADOWS.goldSoft,
  },
  shareBtnText: {
    color: THEME.COLORS.deepAsphalt,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.md,
    marginTop: THEME.SPACING.sm,
  },
  listContent: {
    paddingHorizontal: THEME.SPACING.lg,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    color: THEME.COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    fontSize: 15,
    color: THEME.COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: THEME.COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  backBtnText: {
    color: THEME.COLORS.deepAsphalt,
    fontWeight: '700',
    fontSize: 13,
  },
  skeletonHeader: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.lg,
  },
  skeletonCard: {
    width: (width - THEME.SPACING.lg * 2 - 16) / 2,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME.COLORS.glassModal,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    width: width * 0.88,
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
    marginBottom: THEME.SPACING.md,
  },
  shareLinkText: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
    flex: 1,
    marginRight: 8,
  },
  modalShareBtn: {
    backgroundColor: THEME.COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    ...THEME.SHADOWS.goldSoft,
  },
  modalShareBtnText: {
    color: THEME.COLORS.deepAsphalt,
    fontWeight: '800',
    fontSize: 13,
  },
});

export default SellerProfile;
