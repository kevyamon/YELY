// src/screens/marketplace/CheckoutScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
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
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import { useCreateOrderMutation } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import THEME from '../../theme/theme';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import GlassModal from '../../components/ui/GlassModal';

const CheckoutScreen = ({ navigation }) => {
  useMarketplaceSocketEvents();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  
  const user = useSelector(state => state.auth.user);
  
  const scrollRef = useRef(null);

  const handleInputFocus = (offset) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: offset, animated: true });
    }, 150);
  };
  
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || user?.phoneNumber || '');
  const [name, setName] = useState(user?.name || '');
  const [note, setNote] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('current'); // 'current' or 'other'
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [tempAddress, setTempAddress] = useState('');

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

      // 1. Tenter d'abord la position rapide du cache
      console.log('[CHECKOUT] Recherche cache GPS...');
      let location = await Location.getLastKnownPositionAsync({});
      
      // 2. Si le cache est vide, interroger le GPS en direct
      if (!location) {
        console.log('[CHECKOUT] Cache vide, calcul position temps réel...');
        location = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced,
          timeout: 8000 
        });
      }
      
      if (!location) {
        throw new Error('Impossible de capter la position GPS');
      }

      const coords = [location.coords.longitude, location.coords.latitude];
      console.log('[CHECKOUT] Coords obtenues:', coords);
      setClientCoords(coords);

      // On tente de récupérer l'adresse textuelle en parallèle de manière robuste
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({ 
          longitude: location.coords.longitude, 
          latitude: location.coords.latitude 
        });

        if (reverseGeocode && reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          console.log('[CHECKOUT] Reverse geocode:', addr);
          const parts = [
            addr.name,
            addr.streetNumber,
            addr.street,
            addr.district,
            addr.subregion,
            addr.city,
            addr.region
          ].filter(Boolean);
          
          // Déduplication des segments d'adresse
          const uniqueParts = [...new Set(parts)];
          const addressStr = uniqueParts.join(', ');
          if (addressStr) {
            setAddress(addressStr);
          } else {
            setAddress("Ma position (Abidjan, Côte d'Ivoire)");
          }
        } else {
          setAddress("Ma position (Abidjan, Côte d'Ivoire)");
        }
      } catch (err) {
        console.warn('[CHECKOUT] Reverse geocode failed:', err);
        setAddress("Ma position (Abidjan, Côte d'Ivoire)");
      }

    } catch (error) {
      console.error('[CHECKOUT] Location error:', error);
      dispatch(showToast({ type: 'error', title: 'Erreur GPS', message: 'Impossible de capter votre position automatiquement. Saisissez-la.' }));
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
    <LinearGradient colors={['#000000', '#0B0B0C', '#000000']} style={styles.container}>
      <ScreenWrapper style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={THEME.COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>YÉLY MARKETPLACE</Text>
            <Text style={styles.title}>Validation de commande</Text>
          </View>
        </View>

        <ScrollView 
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                onFocus={() => handleInputFocus(0)}
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
                onFocus={() => handleInputFocus(80)}
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
                    setTempAddress(
                      address === 'Position GPS...' || 
                      address.startsWith('Position GPS:') || 
                      address.startsWith('Ma position') ? '' : address
                    );
                    setIsAddressModalVisible(true);
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
                {deliveryMode === 'other' ? (
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() => {
                      setTempAddress(address);
                      setIsAddressModalVisible(true);
                    }}
                  >
                    <View pointerEvents="none" style={{ flex: 1 }}>
                      <TextInput 
                        style={[styles.input, { flex: 1, paddingRight: 50 }]} 
                        placeholder="Cliquez pour saisir l'adresse..." 
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={address}
                        editable={false}
                        multiline
                      />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TextInput 
                    style={[styles.input, { flex: 1, paddingRight: 50 }]} 
                    placeholder="Riviera, Angré..." 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    onFocus={() => handleInputFocus(180)}
                  />
                )}
                {deliveryMode === 'current' && (
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
                )}
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
                onFocus={() => handleInputFocus(260)}
              />
            </View>
          </GlassCard>

          <View style={styles.orderHeaderRow}>
            <Text style={styles.mainTitle}>VOTRE COMMANDE</Text>
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>{cartItems.length} ARTICLES</Text>
            </View>
          </View>

          <View style={styles.receiptContainer}>
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
                <Text style={styles.proItemPrice}>{(item.price * item.quantity).toLocaleString()} FCFA</Text>
              </View>
            ))}
            
            <View style={styles.proDashedLine} />
            
            <View style={styles.proSummaryRow}>
              <Text style={styles.proSummaryLabel}>SOUS-TOTAL</Text>
              <Text style={styles.proSummaryValue}>{cartTotal.toLocaleString()} FCFA</Text>
            </View>

            <View style={styles.proSummaryRow}>
              <Text style={styles.proSummaryLabel}>FRAIS DE LIVRAISON</Text>
              <Text style={[styles.proSummaryValue, { color: '#2ECC71' }]}>
                {deliveryPrice ? `+ ${deliveryPrice.toLocaleString()} FCFA` : '--'}
              </Text>
            </View>

            <View style={styles.proTotalBlock}>
              <View>
                <Text style={styles.proTotalLabel}>TOTAL À RÉGLER</Text>
                <Text style={styles.proTotalSub}>Net à payer (TTC)</Text>
              </View>
              <Text style={styles.proTotalAmount}>
                {deliveryPrice ? (cartTotal + deliveryPrice).toLocaleString() : cartTotal.toLocaleString()} FCFA
              </Text>
            </View>

            <View style={styles.receiptFooter}>
              <Ionicons name="shield-checkmark" size={14} color={THEME.COLORS.primary} />
              <Text style={styles.receiptFooterText}>PAIEMENT SÉCURISÉ PAR YÉLY</Text>
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <GlassModal
          visible={isAddressModalVisible}
          onClose={() => {
            setIsAddressModalVisible(false);
            if (!address) setDeliveryMode('current');
          }}
          position="center"
          closeOnBackdrop={false}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="map-outline" size={28} color={THEME.COLORS.primary} />
              <Text style={styles.modalTitle}>Adresse de livraison</Text>
              <Text style={styles.modalSubtitle}>Saisissez l'adresse de destination pour votre livraison.</Text>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Cocody Riviera 3, Cité de l'Or, Villa 12..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={tempAddress}
              onChangeText={setTempAddress}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => {
                  setIsAddressModalVisible(false);
                  if (!address) setDeliveryMode('current');
                }}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnConfirm]} 
                onPress={() => {
                  if (!tempAddress.trim()) {
                    dispatch(showToast({ type: 'warning', title: 'Champ requis', message: 'Veuillez saisir une adresse valide.' }));
                    return;
                  }
                  setAddress(tempAddress);
                  setClientCoords([0, 0]); // Mettre des coords non-nulles
                  setIsAddressModalVisible(false);
                  dispatch(showToast({ type: 'success', title: 'Adresse enregistrée', message: 'Votre adresse a été enregistrée avec succès.' }));
                }}
              >
                <Text style={styles.modalBtnConfirmText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassModal>

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
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerSubtitle: { color: '#AAA', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 25 },
  mainTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#FFFFFF', 
    marginTop: 20, 
    marginBottom: 15,
    paddingLeft: 5
  },
  section: { 
    padding: 20, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  inputGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  label: { color: THEME.COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  addressWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%', position: 'relative' },
  input: { 
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16, 
    padding: 16, 
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.25)'
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
  toggleTextActive: { color: '#000000', fontWeight: '800' },
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
  receiptContainer: { 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    marginBottom: 20
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
    backgroundColor: 'rgba(212, 175, 55, 0.08)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)'
  },
  proQtyText: { color: THEME.COLORS.primary, fontWeight: '900', fontSize: 13 },
  proItemDetails: { flex: 1 },
  proItemName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  proItemSeller: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 11, textTransform: 'uppercase', marginTop: 2 },
  proItemPrice: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginLeft: 10 },
  proDashedLine: { 
    height: 1, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)', 
    borderStyle: 'dashed', 
    marginVertical: 20 
  },
  proSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  proSummaryLabel: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  proSummaryValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  proTotalBlock: { 
    marginTop: 20, 
    padding: 18, 
    borderRadius: 18, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.COLORS.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.06)'
  },
  proTotalLabel: { color: '#FFFFFF', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  proTotalSub: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 10, fontWeight: '600', marginTop: 2 },
  proTotalAmount: { color: THEME.COLORS.primary, fontSize: 22, fontWeight: '900' },
  receiptFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 25, 
    gap: 6,
    opacity: 0.8
  },
  receiptFooterText: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
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
  },
  modalContent: {
    padding: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#AAA',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalBtnCancelText: {
    color: '#AAA',
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnConfirm: {
    backgroundColor: THEME.COLORS.primary,
  },
  modalBtnConfirmText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  }
});

export default CheckoutScreen;
