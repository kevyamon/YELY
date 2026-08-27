// src/components/marketplace/checkout/ConfirmationStep.jsx
// ÉTAPE 3 - Résumé de Commande, Défilement des Articles & Validation
// STANDARD: Industriel / Bank Grade

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
      {/* 1. Bannière Jaune Yély Supérieure avec Sac 3D */}
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

        {/* Sac Shopping 3D Stylisé Yély */}
        <View style={styles.shoppingBag3D}>
          <View style={styles.bagHandles} />
          <View style={styles.bagBody}>
            <View style={styles.bagGroceries}>
              <View style={[styles.groceryItem, { backgroundColor: '#FFFFFF' }]} />
              <View style={[styles.groceryItem, { backgroundColor: '#4ADE80' }]} />
              <View style={[styles.groceryBottle, { backgroundColor: '#60A5FA' }]} />
            </View>
            <Text style={styles.bagBrandText}>YÉLY</Text>
          </View>
        </View>
      </LinearGradient>

      {/* 2. Carte Principale Flottante */}
      <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* Carrousel Horizontal des Articles */}
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
          {cartItems.map((item, index) => (
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
              <View style={styles.itemLeadRow}>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>{item.quantity}</Text>
                </View>
                <View style={styles.itemTextGroup}>
                  <Text style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemSeller, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]} numberOfLines={1}>
                    CHEZ {item.sellerName || 'VENDEUR YÉLY'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.itemPrice, { color: textColor }]}>
                {(item.price * item.quantity).toLocaleString()} FCFA
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

        {/* Lignes Financières */}
        <View style={styles.financialRow}>
          <Text style={[styles.financialLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
            SOUS-TOTAL
          </Text>
          <Text style={[styles.financialValue, { color: textColor }]}>
            {cartTotal.toLocaleString()} FCFA
          </Text>
        </View>

        <View style={styles.financialRow}>
          <Text style={[styles.financialLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
            FRAIS DE LIVRAISON
          </Text>
          <Text style={[styles.financialValue, { color: '#10B981' }]}>
            + {deliveryPrice ? deliveryPrice.toLocaleString() : '100'} FCFA
          </Text>
        </View>

        {/* Bloc Total Doré à Régler */}
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : '#FFFDF5',
              borderColor: isDark ? 'rgba(212,175,55,0.35)' : '#F5E6BE',
            },
          ]}
        >
          <View style={styles.totalLeft}>
            <View style={styles.totalIconBadge}>
              <Ionicons name="wallet-outline" size={18} color={THEME.COLORS.champagneGold} />
            </View>
            <View>
              <Text style={[styles.totalTitle, { color: textColor }]}>TOTAL À RÉGLER</Text>
              <Text style={[styles.totalSub, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]}>
                Net à payer (TTC)
              </Text>
            </View>
          </View>
          <Text style={[styles.totalAmount, { color: THEME.COLORS.champagneGold }]}>
            {totalToPay.toLocaleString()} <Text style={styles.totalCurrency}>FCFA</Text>
          </Text>
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
      <TouchableOpacity
        style={[styles.confirmBtn, isLoading && { opacity: 0.7 }]}
        onPress={onConfirmOrder}
        disabled={isLoading}
        activeOpacity={0.85}
      >
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
  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
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
  bannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 10,
  },
  articleBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  articleBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  shoppingBag3D: {
    width: 80,
    height: 90,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bagHandles: {
    width: 32,
    height: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: -2,
    zIndex: 2,
  },
  bagBody: {
    width: 76,
    height: 70,
    backgroundColor: '#FFD700',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  bagGroceries: {
    position: 'absolute',
    top: -12,
    flexDirection: 'row',
    gap: 4,
  },
  groceryItem: {
    width: 14,
    height: 16,
    borderRadius: 4,
  },
  groceryBottle: {
    width: 10,
    height: 20,
    borderRadius: 3,
  },
  bagBrandText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
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
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemsSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollHintText: {
    fontSize: 11,
    fontWeight: '700',
  },
  horizontalScroll: {
    marginBottom: 14,
  },
  horizontalScrollContent: {
    gap: 10,
    paddingRight: 10,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    minWidth: 200,
    maxWidth: 240,
  },
  itemLeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  qtyBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(212,175,55,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.COLORS.champagneGold,
  },
  itemTextGroup: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemSeller: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  financialValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  totalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalSub: {
    fontSize: 11,
    marginTop: 1,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  totalCurrency: {
    fontSize: 12,
    fontWeight: '700',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
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
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginRight: 10,
  },
  lockCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
