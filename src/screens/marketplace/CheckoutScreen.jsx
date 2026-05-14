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

const CheckoutScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [clientCoords, setClientCoords] = useState(null);
  const [deliveryPrice, setDeliveryPrice] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const calculateDeliveryPrice = (distance) => {
    const BASE_FEE = 100;
    const PRICE_PER_KM = 50;
    const MIN_PRICE = 100;
    const MAX_PRICE = 300;
    const rawPrice = BASE_FEE + (distance * PRICE_PER_KM);
    return Math.max(MIN_PRICE, Math.min(MAX_PRICE, Math.round(rawPrice)));
  };

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        dispatch(showToast({ type: 'warning', title: 'Permission refusée', message: 'Veuillez activer la localisation pour une livraison précise.' }));
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = [location.coords.longitude, location.coords.latitude];
      setClientCoords(coords);

      const sellerCoords = cartItems[0]?.sellerCoords || [0, 0];
      if (sellerCoords[0] !== 0 && sellerCoords[1] !== 0) {
        const dist = calculateHaversineDistance(coords, sellerCoords);
        setDistanceKm(dist);
        const price = calculateDeliveryPrice(dist);
        setDeliveryPrice(price);
      }
      
      const reverseGeocode = await Location.reverseGeocodeAsync({ longitude: location.coords.longitude, latitude: location.coords.latitude });
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const addressStr = [addr.streetNumber, addr.street, addr.subregion, addr.region].filter(Boolean).join(', ');
        if (addressStr && !address) setAddress(addressStr);
      }
    } catch (error) {
      console.error('[CHECKOUT] Location error:', error);
      dispatch(showToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'obtenir votre position.' }));
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
    if (cartItems.length > 0 && !clientCoords) {
      getCurrentLocation();
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
          price: item.price
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
    <ScreenWrapper style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Finaliser la commande</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Infos de livraison</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Jean Dupont" 
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone de contact *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: 0707070707" 
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse exacte / Quartier *</Text>
            <View style={styles.addressRow}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="Ex: Riviera Palmeraie, Rue I32" 
                placeholderTextColor="#666"
                value={address}
                onChangeText={setAddress}
                multiline
              />
              <TouchableOpacity 
                style={[styles.locateBtn, isLocating && styles.locateBtnDisabled]} 
                onPress={getCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="locate" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Note pour le livreur (Optionnel)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Sonner à la porte bleue" 
              placeholderTextColor="#666"
              value={note}
              onChangeText={setNote}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé</Text>
          {cartItems.map((item, idx) => (
            <View key={idx} style={styles.summaryItem}>
              <Text style={styles.summaryQty}>{item.quantity}x</Text>
              <Text style={styles.summaryName}>{item.name}</Text>
              <Text style={styles.summaryPrice}>{(item.price * item.quantity).toLocaleString()} F</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total articles</Text>
            <Text style={styles.totalValue}>{cartTotal.toLocaleString()} F</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Livraison {distanceKm ? `(${distanceKm} km)` : ''}
            </Text>
            {isLocating ? (
              <Text style={[styles.totalValue, { color: '#F39C12' }]}>Calcul en cours...</Text>
            ) : deliveryPrice ? (
              <Text style={[styles.totalValue, { color: '#27AE60' }]}>{deliveryPrice.toLocaleString()} F</Text>
            ) : (
              <Text style={[styles.totalValue, { color: '#F39C12' }]}>Non calculé</Text>
            )}
          </View>
          {deliveryPrice && (
            <View style={styles.divider} />
          )}
          {deliveryPrice && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { fontWeight: '800', fontSize: 16, color: '#FFF' }]}>TOTAL</Text>
              <Text style={[styles.totalValue, { color: '#D4AF37', fontSize: 20 }]}>{(cartTotal + deliveryPrice).toLocaleString()} F</Text>
            </View>
          )}
        </GlassCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <GoldButton 
          title="Commander maintenant" 
          onPress={handlePlaceOrder}
          loading={isLoading}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginLeft: 15 },
  scrollContent: { padding: 20 },
  section: { padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.primary, marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { color: '#AAA', fontSize: 13, marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  locateBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center' },
  locateBtnDisabled: { opacity: 0.6 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  summaryQty: { color: THEME.COLORS.primary, fontWeight: 'bold', width: 30 },
  summaryName: { color: '#FFF', flex: 1 },
  summaryPrice: { color: '#FFF', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalLabel: { color: '#AAA' },
  totalValue: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  footer: { paddingHorizontal: 20 }
});

export default CheckoutScreen;
