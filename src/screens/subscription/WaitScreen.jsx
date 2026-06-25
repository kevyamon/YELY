// src/screens/subscription/WaitScreen.jsx
// ECRAN D'ATTENTE - Validation Administrative avec echappatoire securise
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { logout, selectPromoMode, selectSubscriptionStatus, updateSubscriptionStatus, selectCurrentUser, setSubscriptionModalDismissed } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const WaitScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  const subStatus = useSelector(selectSubscriptionStatus);
  const promoMode = useSelector(selectPromoMode);
  const user = useSelector(selectCurrentUser);
  const userRole = user?.role;

  const canGoToDashboard = subStatus?.isActive || promoMode?.isActive;
  const homeScreen = userRole === 'seller' ? 'SellerHome' : 'DriverHome';

  // AJOUT : Écoute en temps réel de la réponse Socket pour rediriger instantanément
  useEffect(() => {
    if (subStatus?.isRejected) {
      navigation.replace('PaymentFailure');
    } else if (subStatus?.isActive && !subStatus?.isPending) {
      navigation.replace(homeScreen);
    }
  }, [subStatus?.isRejected, subStatus?.isActive, subStatus?.isPending, navigation, homeScreen]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleClose = () => {
    dispatch(setSubscriptionModalDismissed(true));
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(homeScreen);
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <GlassCard style={styles.contentCard}>
          
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={THEME.COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={80} color={THEME.COLORS.champagneGold} />
            <ActivityIndicator 
              size="large" 
              color={THEME.COLORS.champagneGold} 
              style={styles.loader} 
            />
          </View>

          <Text style={styles.title}>Traitement en cours</Text>
          
          <Text style={styles.description}>
            Ta capture d'écran a bien été reçue par nos services. Un administrateur vérifie actuellement ton paiement.
          </Text>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color={THEME.COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Activation estimée : moins de 15 minutes.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <GoldButton 
              title="SE DÉCONNECTER"
              onPress={handleLogout}
              style={styles.button}
            />
          </View>
        </GlassCard>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  contentCard: {
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative', 
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 30,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    position: 'absolute',
    transform: [{ scale: 2.5 }],
    opacity: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 35,
    gap: 10,
  },
  infoText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  button: {
    width: '100%',
  }
});

export default WaitScreen;