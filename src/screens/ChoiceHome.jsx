import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectCurrentUser } from '../store/slices/authSlice';
import SelectionCard from '../components/ui/SelectionCard';
import THEME from '../theme/theme';

const ChoiceHome = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const isSeller = user?.role === 'seller';
  const isDriver = user?.role === 'driver';
  const isRider = user?.role === 'passenger' || user?.role === 'rider'; // Selon le label backend
  const displayName = user?.firstName || user?.name?.split(' ')[0] || 'Ami';

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* TOP HEADER WITH MENU - Safe Insets applied */}
      <View style={[styles.topBar, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>YÉLY</Text>
          <View style={styles.brandDot} />
        </View>
        <TouchableOpacity 
          style={styles.menuBtn} 
          onPress={() => navigation.navigate('Menu')}
        >
          <Ionicons name="menu" size={28} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Bonjour {displayName},</Text>
          <Text style={styles.tagline}>Que souhaitez-vous faire aujourd'hui ?</Text>
        </View>

        <View style={styles.cardContainer}>
          {/* LE RIDER ET LE SELLER PEUVENT COMMANDER UNE COURSE */}
          {(isRider || isSeller) && (
            <SelectionCard 
              title="Commander un Taxi"
              subtitle="Déplacez-vous rapidement et en toute sécurité dans toute la ville."
              icon="taxi"
              onPress={() => navigation.navigate('RiderHome')}
              gradientColors={['rgba(212, 175, 55, 0.15)', 'rgba(0, 0, 0, 0)']}
            />
          )}

          {/* TOUT LE MONDE PEUT ACHETER SUR LA MARKETPLACE */}
          <SelectionCard 
            title="Achats & Marché"
            subtitle="Faites vos courses en ligne et faites-vous livrer à domicile."
            icon="shopping"
            onPress={() => navigation.navigate('MarketplaceHub')}
            gradientColors={['rgba(39, 174, 96, 0.1)', 'rgba(0, 0, 0, 0)']}
          />

          {/* SEUL LE SELLER VOIT SON DASHBOARD */}
          {isSeller && (
            <SelectionCard 
              title="Espace Vendeur"
              subtitle="Gérez votre boutique, vos stocks et vos ventes en temps réel."
              icon="storefront-outline"
              onPress={() => navigation.navigate('SellerDashboard')}
              gradientColors={['rgba(212, 175, 55, 0.25)', 'rgba(212, 175, 55, 0.05)']}
            />
          )}

          {/* SEUL LE CHAUFFEUR VOIT SON ESPACE ET IL NE PEUT PAS COMMANDER DE COURSE */}
          {isDriver && (
            <SelectionCard 
              title="Espace Chauffeur"
              subtitle="Acceptez des courses et augmentez vos revenus."
              icon="car-sports"
              onPress={() => navigation.navigate('DriverHome')}
              gradientColors={['rgba(39, 174, 96, 0.2)', 'rgba(0, 0, 0, 0)']}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.md,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandText: {
    color: THEME.COLORS.champagneGold,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: THEME.COLORS.textPrimary,
    marginLeft: 2,
  },
  menuBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: THEME.SPACING.xl,
  },
  welcomeSection: {
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: THEME.SPACING.xl,
    marginBottom: THEME.SPACING.xl,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary,
    opacity: 0.7,
  },
  cardContainer: {
    paddingHorizontal: THEME.SPACING.xl,
  },
});

export default ChoiceHome;
