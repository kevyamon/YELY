// src/components/marketplace/ProductCard.jsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - THEME.SPACING.xl * 3) / 2;

const ProductCard = ({ product, onPress }) => {
  const isSoldOut = product.isSoldOut;

  return (
    <TouchableOpacity 
      style={[styles.card, isSoldOut && styles.soldOutCard]} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isSoldOut}
    >
      <View style={styles.imageContainer}>
        {product.images && product.images[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons name="image-outline" size={40} color={THEME.COLORS.textTertiary} />
          </View>
        )}
        
        {isSoldOut && (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>ÉPUISÉ</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.price}>{product.price} FCFA</Text>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.seller} numberOfLines={1}>{product.seller?.name || 'Vendeur'}</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={12} color={THEME.COLORS.primary} />
            <Text style={styles.rating}>{product.rating || '5.0'}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.addButton} onPress={onPress}>
        <MaterialCommunityIcons name="plus" size={20} color={THEME.COLORS.textInverse} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    marginBottom: THEME.SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    overflow: 'hidden',
    ...THEME.SHADOWS.soft,
  },
  soldOutCard: {
    opacity: 0.6,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH,
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
  soldOutBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#FFFFFF',
    fontWeight: THEME.FONTS.weights.bold,
    fontSize: THEME.FONTS.sizes.caption,
  },
  infoContainer: {
    padding: THEME.SPACING.md,
  },
  price: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
  },
  name: {
    fontSize: THEME.FONTS.sizes.bodySmall,
    fontWeight: THEME.FONTS.weights.semiBold,
    color: THEME.COLORS.textPrimary,
    marginVertical: THEME.SPACING.xxs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.SPACING.xs,
  },
  seller: {
    fontSize: THEME.FONTS.sizes.micro,
    color: THEME.COLORS.textTertiary,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: THEME.FONTS.sizes.micro,
    color: THEME.COLORS.textSecondary,
    marginLeft: 2,
  },
  addButton: {
    position: 'absolute',
    bottom: THEME.SPACING.sm,
    right: THEME.SPACING.sm,
    backgroundColor: THEME.COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.SHADOWS.goldSoft,
  }
});

export default ProductCard;
