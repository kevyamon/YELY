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
    if (cartItems.length > 0 && !clientCoords) {
      getCurrentLocation();
    }
  }, [cartItems]);

  useEffect(() => {
    if (clientCoords && cartItems.length > 0) {
      const item = cartItems[0];
      // Récupération stricte des coordonnées du vendeur depuis le panier
      const sellerCoords = item.sellerCoords || [0, 0];
      
      console.log('[CHECKOUT] Position Client:', clientCoords);
      console.log('[CHECKOUT] Position Vendeur:', sellerCoords);
      
      if (sellerCoords[0] !== 0 && sellerCoords[1] !== 0) {
        const dist = calculateHaversineDistance(clientCoords, sellerCoords);
        console.log('[CHECKOUT] Distance réelle:', dist, 'km');
        
        setDistanceKm(dist);
        const price = calculateDeliveryPrice(dist);
        setDeliveryPrice(price);
      } else {
        console.warn('[CHECKOUT] Impossible de calculer le trajet: Position vendeur inconnue.');
        // On ne met pas de prix par défaut pour forcer la précision
        setDeliveryPrice(null); 
      }
    }
  }, [clientCoords, cartItems]);

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
    <LinearGradient colors={['#000000', '#1A1A1A', '#000000']} style={styles.container}>
      <ScreenWrapper style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Finaliser la commande</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ... reste du contenu ... */}
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
          title={!deliveryPrice ? "Calcul du trajet..." : "Commander maintenant"} 
          onPress={handlePlaceOrder}
          loading={isLoading || isLocating}
          disabled={!deliveryPrice || isLocating}
        />
      </View>
      </ScreenWrapper>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginLeft: 15 },
  scrollContent: { padding: 20 },
  section: { padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.primary, marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#D4AF37', fontSize: 14, fontWeight: '600', marginBottom: 10, letterSpacing: 0.5 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 16, 
    padding: 16, 
    color: '#FFF', 
    borderWidth: 1.5, 
    borderColor: 'rgba(212, 175, 55, 0.2)',
    fontSize: 15,
    textAlignVertical: 'top'
  },
  locateBtn: { 
    width: 56, 
    height: 56, 
    borderRadius: 16, 
    backgroundColor: '#D4AF37', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  locateBtnDisabled: { opacity: 0.5, backgroundColor: '#555' },
  summaryItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryQty: { color: '#D4AF37', fontWeight: '800', width: 35, fontSize: 15 },
  summaryName: { color: '#EEE', flex: 1, fontSize: 15 },
  summaryPrice: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  divider: { height: 1, backgroundColor: 'rgba(212, 175, 55, 0.15)', marginVertical: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { color: '#AAA', fontSize: 15 },
  totalValue: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  footer: { paddingHorizontal: 20, paddingTop: 10 }
});

export default CheckoutScreen;
