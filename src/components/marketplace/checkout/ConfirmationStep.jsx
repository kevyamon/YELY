// src/components/marketplace/checkout/ConfirmationStep.jsx
// ÉTAPE 3 - Résumé de Commande & Validation
// STANDARD: Industriel / Bank Grade (Strict <= 325 lignes)

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import THEME from '../../../theme/theme';

export default function ConfirmationStep({
  cartItems = [],
  cartTotal = 0,
  deliveryPrice = 0,
  isLoading = false,
  onConfirmOrder,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const totalToPay = cartTotal + (deliveryPrice || 0);

  return (
    <View style={styles.container}>
      {/* 1. Bannière Dorée Supérieure avec Sac 3D Yély */}
      <LinearGradient
        colors={isDark ? ['#9E7D23', '#5E4A10'] : ['#E5B22E', '#D4A017']}
        style={styles.bannerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerTitle}>Résumé de votre{'\n'}commande</Text>
          <View style={styles.articleBadge}>
            <Text style={styles.articleBadgeText}>
              {cartItems.length} {cartItems.length > 1 ? 'ARTICLES' : 'ARTICLE'}
            </Text>
          </View>
        </View>

        <Image
          source={require('../../../../assets/images/shopping3D.png')}
          style={{ width: 96, height: 96 }}
          resizeMode="contain"
        />
      </LinearGradient>

      {/* 2. Carte Principale Flottante */}
      <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* Carrousel Horizontal des Articles avec Photos */}
        <View style={styles.itemsHeaderRow}>
          <Text style={[styles.itemsSectionLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
            ARTICLES COMMANDÉS
          </Text>
          {cartItems.length > 1 && (
            <View style={styles.scrollHintRow}>
              <Text style={[styles.scrollHintText, { color: THEME.COLORS.champagneGold }]}>Faire défiler</Text>
              <Ionicons name="arrow-forward" size={12} color={THEME.COLORS.champagneGold} />
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
          style={styles.horizontalScroll}
        >
          {cartItems.map((item, index) => {
            const itemImageUri = item.image || item.imageUrl || (item.images && item.images[0]);

            return (
              <View
                key={index}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <View style={{ position: 'relative' }}>
                  {itemImageUri ? (
                    <Image source={{ uri: itemImageUri }} style={styles.itemThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.itemThumb, { backgroundColor: isDark ? '#222' : '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="cube-outline" size={18} color={THEME.COLORS.champagneGold} />
                    </View>
                  )}
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyBadgeText}>{item.quantity}</Text>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemSeller, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]} numberOfLines={1}>
                    CHEZ {item.sellerName || 'VENDEUR YÉLY'}
                  </Text>
                  <Text style={[styles.itemPrice, { color: textColor }]}>
                    {(item.price * item.quantity).toLocaleString()} FCFA
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

        {/* Lignes Financières */}
        <View style={styles.financialRow}>
          <Text style={[styles.financialLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>SOUS-TOTAL</Text>
          <Text style={[styles.financialValue, { color: textColor }]}>{cartTotal.toLocaleString()} FCFA</Text>
        </View>

        <View style={styles.financialRow}>
          <Text style={[styles.financialLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>FRAIS DE LIVRAISON</Text>
          <Text style={[styles.financialValue, { color: '#10B981' }]}>+ {deliveryPrice ? deliveryPrice.toLocaleString() : '100'} FCFA</Text>
        </View>

        {/* Bloc Total Doré Résistant aux Grands Montants */}
        <View style={[styles.totalCard, { backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : '#FFFDF5', borderColor: isDark ? 'rgba(212,175,55,0.35)' : '#F5E6BE' }]}>
          <View style={styles.totalLeft}>
            <View style={styles.totalIconBadge}>
              <Ionicons name="wallet-outline" size={18} color={THEME.COLORS.champagneGold} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.totalTitle, { color: textColor }]}>TOTAL À RÉGLER</Text>
              <Text style={[styles.totalSub, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]}>Net à payer (TTC)</Text>
            </View>
          </View>

          <View style={styles.totalRight}>
            <Text style={[styles.totalAmount, { color: THEME.COLORS.champagneGold }]} numberOfLines={1} adjustsFontSizeToFit>
              {totalToPay.toLocaleString()}
            </Text>
            <Text style={[styles.totalCurrency, { color: THEME.COLORS.champagneGold }]}>FCFA</Text>
          </View>
        </View>

        {/* Bloc Sécurité */}
        <View style={[styles.securityCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA' }]}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityTitle, { color: textColor }]}>Paiement 100% sécurisé</Text>
            <Text style={[styles.securityDesc, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]}>
              Vos transactions sont protégées et cryptées de bout en bout par Yély.
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Bouton Confirmer la Commande */}
      <TouchableOpacity style={[styles.confirmBtn, isLoading && { opacity: 0.7 }]} onPress={onConfirmOrder} disabled={isLoading} activeOpacity={0.85}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <>
            <Text style={styles.confirmBtnText}>Confirmer la commande</Text>
            <View style={styles.lockCircle}>
              <Ionicons name="lock-closed" size={16} color="#000000" />
            </View>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 30 },
  bannerContainer: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -16,
    zIndex: 1,
    overflow: 'hidden',
  },
  bannerLeft: { flex: 1, paddingRight: 10 },
  bannerTitle: { fontSize: 21, fontWeight: '900', color: '#FFFFFF', lineHeight: 26, marginBottom: 10 },
  articleBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  articleBadgeText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 },
  mainCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    paddingTop: 28,
    marginBottom: 20,
    zIndex: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  itemsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemsSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  scrollHintRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scrollHintText: { fontSize: 11, fontWeight: '700' },
  horizontalScroll: { marginBottom: 14 },
  horizontalScrollContent: { gap: 10, paddingRight: 10 },
  itemCard: { borderRadius: 16, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', minWidth: 210, maxWidth: 260, gap: 10 },
  itemThumb: { width: 44, height: 44, borderRadius: 10 },
  qtyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  qtyBadgeText: { fontSize: 9.5, fontWeight: '900', color: '#000000' },
  itemName: { fontSize: 12.5, fontWeight: '700' },
  itemSeller: { fontSize: 10, fontWeight: '600', marginTop: 1, textTransform: 'uppercase' },
  itemPrice: { fontSize: 12.5, fontWeight: '800', marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  financialLabel: { fontSize: 11.5, fontWeight: '600', letterSpacing: 0.4 },
  financialValue: { fontSize: 13.5, fontWeight: '700' },
  totalCard: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  totalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 },
  totalIconBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.15)', justifyContent: 'center', alignItems: 'center' },
  totalTitle: { fontSize: 12.5, fontWeight: '800' },
  totalSub: { fontSize: 10.5, marginTop: 1 },
  totalRight: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  totalAmount: { fontSize: 17, fontWeight: '900' },
  totalCurrency: { fontSize: 11, fontWeight: '800' },
  securityCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, marginTop: 4 },
  securityTitle: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  securityDesc: { fontSize: 11, lineHeight: 15 },
  confirmBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 18,
    backgroundColor: THEME.COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '800', color: '#000000', marginRight: 10 },
  lockCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0, 0, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
});
