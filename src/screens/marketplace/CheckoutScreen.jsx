// src/screens/marketplace/CheckoutScreen.jsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, selectCartTotal, clearCart } from '../../store/slices/cartSlice';
import { useCreateOrderMutation } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import THEME from '../../theme/theme';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const CheckoutScreen = ({ navigation }) => {
  // ... (state reste inchangé)
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  
  const user = useSelector(state => state.auth.user);
  
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || user?.phoneNumber || '');
  const [name, setName] = useState(user?.name || '');
  const [note, setNote] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('current'); // 'current' or 'other'

  // FORCE AUTO-FILL (Si les données arrivent après le chargement de l'écran)
  useEffect(() => {
    if (user) {
      console.log('[CHECKOUT] User Data detected:', user);
      if (!name && user.name) setName(user.name);
      if (!phone) {
        const p = user.phone || user.phoneNumber;
        if (p) {
          console.log('[CHECKOUT] Setting phone to:', p);
          setPhone(p);
        }
      }
    }
  }, [user]);
  const [clientCoords, setClientCoords] = useState(null);
  const [deliveryPrice, setDeliveryPrice] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [createOrder, { isLoading }] = useCreateOrderMutation();


  const getCurrentLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      console.log('[CHECKOUT] Démarrage localisation...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        dispatch(showToast({ type: 'warning', title: 'Permission refusée', message: 'Veuillez activer la localisation pour calculer les frais.' }));
        setIsLocating(false);
        return;
      }

      // Utilisation d'une précision équilibrée pour plus de rapidité
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000 
      });
      
      const coords = [location.coords.longitude, location.coords.latitude];
      console.log('[CHECKOUT] Coords obtenues:', coords);
      setClientCoords(coords);

      // On tente de récupérer l'adresse textuelle en parallèle
      Location.reverseGeocodeAsync({ 
        longitude: location.coords.longitude, 
        latitude: location.coords.latitude 
      }).then(reverseGeocode => {
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const addressStr = [addr.streetNumber, addr.street, addr.subregion, addr.region].filter(Boolean).join(', ');
          if (addressStr && !address) setAddress(addressStr);
        }
      }).catch(err => console.warn('[CHECKOUT] Reverse geocode failed:', err));

    } catch (error) {
      console.error('[CHECKOUT] Location error:', error);
      dispatch(showToast({ type: 'error', title: 'Erreur GPS', message: 'Impossible de capter votre position. Réessayez.' }));
    } finally {
      setIsLocating(false);
    }
  };

  const calculateHaversineDistance = (coords1, coords2) => {
    if (!coords1 || !coords2 || coords1.length !== 2 || coords2.length !== 2) return 0;
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  useEffect(() => {
    if (cartItems.length > 0 && !clientCoords && deliveryMode === 'current') {
      getCurrentLocation();
    }
  }, [cartItems, deliveryMode]);

  const calculateDeliveryPrice = (nbSellers) => {
    if (nbSellers <= 0) return 0;
    let price = 100 + (nbSellers - 1) * 50;
    return Math.min(300, price);
  };

  useEffect(() => {
    if (cartItems.length > 0) {
      // Identifier les vendeurs uniques
      const uniqueSellersIds = new Set(cartItems.map(item => item.sellerId));
      const nbSellers = uniqueSellersIds.size;
      
      const price = calculateDeliveryPrice(nbSellers);
      setDeliveryPrice(price);
      console.log(`[CHECKOUT] ${nbSellers} vendeurs. Prix livraison: ${price}F`);
    }
  }, [cartItems]);

  const handlePlaceOrder = async () => {
    if (!address || !phone || !name) {
      dispatch(showToast({ type: 'error', title: 'Infos manquantes', message: 'Veuillez remplir tous les champs obligatoires.' }));
      return;
    }

    try {
      const orderData = {
        items: cartItems.map(item => ({
          product: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sellerId: item.sellerId // CRUCIAL POUR LE CALCUL BACKEND
        })),
        sellerId: cartItems[0].sellerId,
        shippingAddress: {
          address: address,
          coordinates: clientCoords || [0, 0]
        },
        customerName: name,
        customerPhone: phone,
        note: note
      };

      const result = await createOrder(orderData).unwrap();
      
      dispatch(clearCart());
      dispatch(showToast({ 
        type: 'success', 
        title: 'Commande validée !', 
        message: 'Votre commande a été transmise au vendeur.' 
      }));

      navigation.replace('OrderTracking', { orderId: result.data._id });
    } catch (error) {
      dispatch(showToast({ 
        type: 'error', 
        title: 'Erreur', 
        message: error.data?.message || 'Impossible de valider la commande.' 
      }));
    }
  };

  return (
    <LinearGradient colors={['#000000', '#1A1405', '#000000']} style={styles.container}>
      <ScreenWrapper style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#D4AF37" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSubtitle}>Marketplace</Text>
            <Text style={styles.title}>Finalisation</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Détails de livraison</Text>
          <GlassCard style={styles.section}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="person-outline" size={16} color={THEME.COLORS.primary} />
                <Text style={styles.label}>NOM COMPLET</Text>
              </View>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: Jean Dupont" 
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="call-outline" size={16} color={THEME.COLORS.primary} />
                <Text style={styles.label}>TÉLÉPHONE</Text>
              </View>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: 07 00 00 00 00" 
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="bicycle-outline" size={16} color={THEME.COLORS.primary} />
                <Text style={styles.label}>MODE DE LIVRAISON</Text>
              </View>
              
              <View style={styles.deliveryToggleRow}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, deliveryMode === 'current' && styles.toggleBtnActive]}
                  onPress={() => {
                    setDeliveryMode('current');
                    getCurrentLocation();
                  }}
                >
                  <Ionicons name="locate" size={18} color={deliveryMode === 'current' ? '#000' : '#AAA'} />
                  <Text style={[styles.toggleText, deliveryMode === 'current' && styles.toggleTextActive]}>Ma position</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.toggleBtn, deliveryMode === 'other' && styles.toggleBtnActive]}
                  onPress={() => {
                    setDeliveryMode('other');
                    setAddress('');
                    setClientCoords(null);
                  }}
                >
                  <Ionicons name="map" size={18} color={deliveryMode === 'other' ? '#000' : '#AAA'} />
                  <Text style={[styles.toggleText, deliveryMode === 'other' && styles.toggleTextActive]}>Ailleurs</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="location-outline" size={16} color={THEME.COLORS.primary} />
                <Text style={styles.label}>{deliveryMode === 'current' ? 'VOTRE POSITION ACTUELLE' : 'ADRESSE DE LIVRAISON'}</Text>
              </View>
              <View style={styles.addressWrapper}>
                <TextInput 
                  style={[styles.input, { flex: 1, paddingRight: 50 }]} 
                  placeholder="Riviera, Angré..." 
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
                <TouchableOpacity 
                  style={styles.inlineLocateBtn} 
                  onPress={getCurrentLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color={THEME.COLORS.primary} />
                  ) : (
                    <Ionicons name="locate" size={22} color={THEME.COLORS.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={THEME.COLORS.primary} />
                <Text style={styles.label}>NOTE (OPTIONNEL)</Text>
              </View>
              <TextInput 
                style={styles.input} 
                placeholder="Précisions pour le livreur..." 
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={note}
                onChangeText={setNote}
              />
            </View>
          </GlassCard>

          <View style={styles.orderHeaderRow}>
            <Text style={styles.mainTitle}>VOTRE COMMANDE</Text>
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>{cartItems.length} ARTICLES</Text>
            </View>
          </View>

          <View style={styles.receiptSlit} />
          
          <View style={styles.receiptInfinity}>
            <View style={styles.receiptTopDecorative}>
              <View style={styles.zigzag} />
            </View>

            {cartItems.map((item, idx) => (
              <View key={idx} style={styles.proReceiptItem}>
                <View style={styles.proItemLead}>
                  <View style={styles.proQtyCircle}>
                    <Text style={styles.proQtyText}>{item.quantity}</Text>
                  </View>
                  <View style={styles.proItemDetails}>
                    <Text style={styles.proItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.proItemSeller}>Chez {item.sellerName || 'Vendeur Yély'}</Text>
                  </View>
                </View>
                <Text style={styles.proItemPrice}>{(item.price * item.quantity).toLocaleString()} F</Text>
              </View>
            ))}
            
            <View style={styles.proDashedLine} />
            
            <View style={styles.proSummaryRow}>
              <Text style={styles.proSummaryLabel}>SOUS-TOTAL</Text>
              <Text style={styles.proSummaryValue}>{cartTotal.toLocaleString()} F</Text>
            </View>

            <View style={styles.proSummaryRow}>
              <Text style={styles.proSummaryLabel}>FRAIS DE LIVRAISON</Text>
              <Text style={[styles.proSummaryValue, { color: '#2ECC71' }]}>
                {deliveryPrice ? `+ ${deliveryPrice.toLocaleString()} F` : '--'}
              </Text>
            </View>

            <LinearGradient 
              colors={[THEME.COLORS.primary, '#FFD700']} 
              start={{x:0, y:0}} end={{x:1, y:1}}
              style={styles.proTotalBlock}
            >
              <View>
                <Text style={styles.proTotalLabel}>TOTAL À RÉGLER</Text>
                <Text style={styles.proTotalSub}>Net à payer (TTC)</Text>
              </View>
              <Text style={styles.proTotalAmount}>
                {deliveryPrice ? (cartTotal + deliveryPrice).toLocaleString() : cartTotal.toLocaleString()} F
              </Text>
            </LinearGradient>

            <View style={styles.receiptFooter}>
              <Ionicons name="shield-checkmark" size={12} color="#AAA" />
              <Text style={styles.receiptFooterText}>PAIEMENT SÉCURISÉ PAR YÉLY</Text>
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <GoldButton 
            title={!deliveryPrice ? "Calcul du trajet..." : "Confirmer la commande"} 
            onPress={handlePlaceOrder}
            loading={isLoading || isLocating}
            disabled={!deliveryPrice || isLocating}
            style={styles.confirmBtn}
          />
        </View>
      </ScreenWrapper>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingBottom: 20 
  },
  backBtn: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    backgroundColor: 'rgba(212,175,55,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)'
  },
  headerSubtitle: { color: '#AAA', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  title: { fontSize: 24, fontWeight: '800', color: THEME.COLORS.white },
  scrollContent: { paddingHorizontal: 25 },
  mainTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: THEME.COLORS.white, 
    marginTop: 20, 
    marginBottom: 15,
    paddingLeft: 5
  },
  section: { 
    padding: 20, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  inputGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  label: { color: THEME.COLORS.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  addressWrapper: { flexDirection: 'row', alignItems: 'center' },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15, 
    padding: 18, 
    color: THEME.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)'
  },
  inlineLocateBtn: {
    position: 'absolute',
    right: 15,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deliveryToggleRow: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 12, 
    padding: 4, 
    gap: 4,
    marginBottom: 10
  },
  toggleBtn: { 
    flex: 1, 
    flexDirection: 'row',
    height: 40, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 8
  },
  toggleBtnActive: { backgroundColor: THEME.COLORS.primary },
  toggleText: { color: '#AAA', fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: '#000' },
  orderHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 25, 
    marginBottom: 10 
  },
  itemCountBadge: { 
    backgroundColor: 'rgba(212,175,55,0.15)', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)'
  },
  itemCountText: { color: THEME.COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  receiptSlit: {
    height: 4,
    backgroundColor: '#1A1405',
    marginHorizontal: 10,
    borderRadius: 2,
    marginBottom: -2,
    zIndex: 10
  },
  receiptInfinity: { 
    backgroundColor: THEME.COLORS.white, 
    padding: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10
  },
  receiptTopDecorative: {
    height: 15,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    marginTop: -25,
    marginBottom: 10
  },
  proReceiptItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  proItemLead: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  proQtyCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#F9F9F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  proQtyText: { color: '#333', fontWeight: '900', fontSize: 13 },
  proItemDetails: { flex: 1 },
  proItemName: { color: '#222', fontSize: 16, fontWeight: '700' },
  proItemSeller: { color: '#999', fontSize: 11, textTransform: 'uppercase', marginTop: 2 },
  proItemPrice: { color: '#000', fontSize: 16, fontWeight: '800', marginLeft: 10 },
  proDashedLine: { 
    height: 1, 
    borderWidth: 1, 
    borderColor: '#EEE', 
    borderStyle: 'dashed', 
    marginVertical: 20 
  },
  proSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  proSummaryLabel: { color: '#777', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  proSummaryValue: { color: '#000', fontSize: 16, fontWeight: '700' },
  proTotalBlock: { 
    marginTop: 20, 
    padding: 20, 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  proTotalLabel: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  proTotalSub: { color: 'rgba(0,0,0,0.5)', fontSize: 10, fontWeight: '600', marginTop: 2 },
  proTotalAmount: { color: '#000', fontSize: 24, fontWeight: '900' },
  receiptFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 25, 
    gap: 6,
    opacity: 0.5
  },
  receiptFooterText: { color: '#777', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  footer: { 
    paddingHorizontal: 25, 
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: 'transparent'
  },
  confirmBtn: {
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    elevation: 10
  }
});

export default CheckoutScreen;
