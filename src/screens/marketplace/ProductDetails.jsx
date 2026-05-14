// src/screens/marketplace/ProductDetails.jsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGetProductQuery } from '../../store/api/marketplaceApiSlice';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

const ProductDetails = ({ route, navigation }) => {
  const { productId } = route.params;
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading } = useGetProductQuery(productId);
  const product = data?.data;

  const handleAddToCart = () => {
    // Logique du panier à implémenter dans la prochaine vague
    navigation.navigate('Cart', { product, quantity });
  };

  if (isLoading || !product) {
    return (
      <View style={styles.center}>
        <Text style={{ color: THEME.COLORS.textPrimary }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {product.images && product.images[0] ? (
            <Image source={{ uri: product.images[0] }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialCommunityIcons name="image-outline" size={80} color={THEME.COLORS.textTertiary} />
            </View>
          )}
          
          <SafeAreaView style={styles.headerOverlay}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialCommunityIcons name="share-variant" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={styles.mainInfo}>
            <Text style={styles.category}>{product.category}</Text>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>{product.price} FCFA</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.sellerSection}>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <MaterialCommunityIcons name="storefront" size={24} color={THEME.COLORS.primary} />
              </View>
              <View>
                <Text style={styles.sellerName}>{product.seller?.name || 'Vendeur Yély'}</Text>
                <Text style={styles.sellerSubtitle}>Vendeur vérifié</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={16} color={THEME.COLORS.primary} />
              <Text style={styles.ratingText}>{product.rating || '5.0'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantité</Text>
            <View style={styles.quantityPicker}>
              <TouchableOpacity 
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityButton}
              >
                <MaterialCommunityIcons name="minus" size={20} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                onPress={() => setQuantity(quantity + 1)}
                style={styles.quantityButton}
              >
                <MaterialCommunityIcons name="plus" size={20} color={THEME.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{product.price * quantity} FCFA</Text>
        </View>
        <TouchableOpacity style={styles.buyButton} onPress={handleAddToCart}>
          <Text style={styles.buyButtonText}>Ajouter au panier</Text>
          <MaterialCommunityIcons name="basket-plus" size={20} color={THEME.COLORS.textInverse} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: THEME.COLORS.overlay,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: THEME.SPACING.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: THEME.SPACING.xl,
    backgroundColor: THEME.COLORS.background,
    borderTopLeftRadius: THEME.BORDERS.radius.xxl,
    borderTopRightRadius: THEME.BORDERS.radius.xxl,
    marginTop: -20,
  },
  mainInfo: {
    marginBottom: THEME.SPACING.lg,
  },
  category: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.primary,
    fontWeight: THEME.FONTS.weights.bold,
    textTransform: 'uppercase',
    marginBottom: THEME.SPACING.xs,
  },
  name: {
    fontSize: THEME.FONTS.sizes.h2,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.sm,
  },
  price: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.COLORS.border,
    marginVertical: THEME.SPACING.lg,
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.SPACING.md,
  },
  sellerName: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  sellerSubtitle: {
    fontSize: THEME.FONTS.sizes.caption,
    color: THEME.COLORS.textTertiary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs,
    borderRadius: THEME.BORDERS.radius.sm,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  ratingText: {
    fontSize: THEME.FONTS.sizes.caption,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: THEME.FONTS.sizes.h4,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.md,
  },
  description: {
    fontSize: THEME.FONTS.sizes.bodySmall,
    color: THEME.COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: THEME.SPACING.xl,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    paddingHorizontal: THEME.SPACING.xl,
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.COLORS.glassModal,
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: THEME.FONTS.sizes.micro,
    color: THEME.COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: THEME.FONTS.sizes.h4,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  buyButton: {
    flex: 2,
    height: 52,
    backgroundColor: THEME.COLORS.primary,
    borderRadius: THEME.BORDERS.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.SHADOWS.gold,
  },
  buyButtonText: {
    color: THEME.COLORS.textInverse,
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.background,
  }
});

export default ProductDetails;
