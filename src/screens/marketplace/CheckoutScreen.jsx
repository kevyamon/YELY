// src/screens/marketplace/CheckoutScreen.jsx
// ORCHESTRATEUR DU TUNNEL DE COMMANDE (3 ÉTAPES)
// STANDARD: Industriel / Bank Grade

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Text,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

import { selectCartItems, selectCartTotal, clearCart } from '../../store/slices/cartSlice';
import useMarketplaceSocketEvents from '../../hooks/useMarketplaceSocketEvents';
import { useCreateOrderMutation } from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassModal from '../../components/ui/GlassModal';
import GoldButton from '../../components/ui/GoldButton';
import MapService from '../../services/mapService';
import { isLocationInMafereZone } from '../../utils/mafereZone';
import useGeolocation from '../../hooks/useGeolocation';
import THEME from '../../theme/theme';

import CheckoutStepper from '../../components/marketplace/checkout/CheckoutStepper';
import DeliveryStep from '../../components/marketplace/checkout/DeliveryStep';
import PaymentStep from '../../components/marketplace/checkout/PaymentStep';
import ConfirmationStep from '../../components/marketplace/checkout/ConfirmationStep';

const CheckoutScreen = ({ navigation }) => {
  useMarketplaceSocketEvents();
  const { location: userGeoLocation } = useGeolocation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const gradientColors = isDark ? ['#000000', '#0B0B0C', '#000000'] : ['#F8F9FA', '#F3F4F6', '#E5E7EB'];

  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const user = useSelector((state) => state.auth.user);

  const [currentStep, setCurrentStep] = useState(1);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || user?.phoneNumber || '');
  const [name, setName] = useState(user?.name || '');
  const [note, setNote] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('current');
  const [clientCoords, setClientCoords] = useState(null);
  const [deliveryPrice, setDeliveryPrice] = useState(100);
  const [isLocating, setIsLocating] = useState(false);

  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isOutOfZoneModalVisible, setIsOutOfZoneModalVisible] = useState(false);
  const [tempAddress, setTempAddress] = useState('');

  const [createOrder, { isLoading }] = useCreateOrderMutation();

  // Remplissage automatique des coordonnées client
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!phone) {
        const p = user.phone || user.phoneNumber;
        if (p) setPhone(p);
      }
    }
  }, [user]);

  // Localisation intelligente par cache puis GPS en direct
  const getCurrentLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        dispatch(showToast({ type: 'warning', title: 'GPS Requis', message: 'Veuillez activer la localisation.' }));
        setIsLocating(false);
        return;
      }

      let location = await Location.getLastKnownPositionAsync({});
      if (!location) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 8000 });
      }

      if (location) {
        const coords = [location.coords.longitude, location.coords.latitude];
        setClientCoords(coords);

        try {
          const addressStr = await MapService.getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
          if (addressStr && addressStr !== 'Adresse introuvable') {
            setAddress(addressStr);
          } else {
            setAddress("Ma position (Abidjan, Côte d'Ivoire)");
          }
        } catch {
          setAddress("Ma position (Abidjan, Côte d'Ivoire)");
        }
      }
    } catch {
      dispatch(showToast({ type: 'error', title: 'Erreur GPS', message: 'Impossible de capter la position.' }));
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (cartItems.length > 0 && !clientCoords && deliveryMode === 'current') {
      getCurrentLocation();
    }
  }, [cartItems, deliveryMode]);

  // Calcul du prix de livraison selon le nombre de vendeurs
  useEffect(() => {
    if (cartItems.length > 0) {
      const uniqueSellers = new Set(cartItems.map((item) => item.sellerId));
      const nb = uniqueSellers.size;
      const price = Math.min(300, 100 + (nb - 1) * 50);
      setDeliveryPrice(price);
    }
  }, [cartItems]);

  // Navigation du Stepper
  const handleBack = () => {
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
    else navigation.goBack();
  };

  const handleNextFromDelivery = () => {
    if (!name.trim()) {
      dispatch(showToast({ type: 'warning', title: 'Nom requis', message: 'Veuillez renseigner votre nom complet.' }));
      return;
    }
    if (!phone.trim()) {
      dispatch(showToast({ type: 'warning', title: 'Téléphone requis', message: 'Veuillez saisir votre numéro de téléphone.' }));
      return;
    }
    if (!address.trim()) {
      dispatch(showToast({ type: 'warning', title: 'Adresse requise', message: 'Veuillez spécifier votre adresse de livraison.' }));
      return;
    }
    setCurrentStep(2);
  };

  // Envoi de la commande finale au Backend
  const handlePlaceOrder = async () => {
    const checkCoords = clientCoords && clientCoords[0] !== 0 && clientCoords[1] !== 0
      ? { latitude: clientCoords[1], longitude: clientCoords[0] }
      : userGeoLocation;

    if (!checkCoords || !isLocationInMafereZone(checkCoords)) {
      setIsOutOfZoneModalVisible(true);
      return;
    }

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          product: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sellerId: item.sellerId,
        })),
        sellerId: cartItems[0]?.sellerId,
        shippingAddress: {
          address: address,
          coordinates: clientCoords || [0, 0],
        },
        customerName: name,
        customerPhone: phone,
        note: note,
      };

      const result = await createOrder(orderData).unwrap();

      dispatch(clearCart());
      dispatch(showToast({
        type: 'success',
        title: 'Commande validée !',
        message: 'Votre commande a été transmise avec succès.',
      }));

      navigation.replace('OrderTracking', { orderId: result.data._id });
    } catch (error) {
      dispatch(showToast({
        type: 'error',
        title: 'Erreur',
        message: error.data?.message || 'Impossible de valider la commande.',
      }));
    }
  };

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <ScreenWrapper style={{ flex: 1, backgroundColor: 'transparent' }}>
        <CheckoutStepper currentStep={currentStep} onBack={handleBack} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: insets.bottom + 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && (
            <DeliveryStep
              name={name}
              setName={setName}
              phone={phone}
              setPhone={setPhone}
              deliveryMode={deliveryMode}
              setDeliveryMode={setDeliveryMode}
              address={address}
              setAddress={setAddress}
              note={note}
              setNote={setNote}
              isLocating={isLocating}
              onLocatePress={getCurrentLocation}
              onSelectOtherAddress={() => {
                setDeliveryMode('other');
                setTempAddress(address.startsWith('Ma position') ? '' : address);
                setIsAddressModalVisible(true);
              }}
              onNext={handleNextFromDelivery}
            />
          )}

          {currentStep === 2 && (
            <PaymentStep onNext={() => setCurrentStep(3)} />
          )}

          {currentStep === 3 && (
            <ConfirmationStep
              cartItems={cartItems}
              cartTotal={cartTotal}
              deliveryPrice={deliveryPrice}
              isLoading={isLoading}
              onConfirmOrder={handlePlaceOrder}
            />
          )}
        </ScrollView>

        {/* Modale de saisie manuelle d'adresse */}
        <GlassModal visible={isAddressModalVisible} onClose={() => setIsAddressModalVisible(false)} position="center">
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>Adresse de livraison</Text>
            <TextInput
              style={[styles.modalInput, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}
              placeholder="Ex: Marché central, près de la pharmacie..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              value={tempAddress}
              onChangeText={setTempAddress}
              multiline
              numberOfLines={3}
            />
            <GoldButton
              title="Valider l'adresse"
              onPress={() => {
                if (!tempAddress.trim()) {
                  dispatch(showToast({ type: 'warning', title: 'Champ requis', message: 'Saisissez une adresse.' }));
                  return;
                }
                setAddress(tempAddress);
                setClientCoords([0, 0]);
                setIsAddressModalVisible(false);
              }}
              style={{ marginTop: 12 }}
            />
          </View>
        </GlassModal>

        {/* Modale Hors Zone */}
        <GlassModal visible={isOutOfZoneModalVisible} onClose={() => setIsOutOfZoneModalVisible(false)} position="center">
          <View style={styles.modalContent}>
            <Ionicons name="location-outline" size={36} color={THEME.COLORS.danger} style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A', textAlign: 'center' }]}>Zone non couverte</Text>
            <Text style={[styles.modalDesc, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
              Désolé, vous êtes actuellement hors de la zone de couverture Yély.
            </Text>
            <GoldButton title="J'ai compris" onPress={() => setIsOutOfZoneModalVisible(false)} style={{ marginTop: 16 }} />
          </View>
        </GlassModal>
      </ScreenWrapper>
    </LinearGradient>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  modalDesc: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 14,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
