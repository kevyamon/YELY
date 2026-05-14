// src/screens/ChoiceHome.jsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Image, 
  StatusBar 
} from 'react-native';
import SelectionCard from '../components/ui/SelectionCard';
import THEME from '../theme/theme';

const ChoiceHome = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.welcome}>Bonjour,</Text>
        <Text style={styles.tagline}>Que souhaitez-vous faire aujourd'hui ?</Text>
      </View>

      <View style={styles.cardContainer}>
        <SelectionCard 
          title="Commander un Taxi"
          subtitle="Déplacez-vous rapidement et en toute sécurité dans toute la ville."
          icon="taxi"
          onPress={() => navigation.navigate('RiderHome')}
          gradientColors={['rgba(212, 175, 55, 0.15)', 'rgba(0, 0, 0, 0)']}
        />

        <SelectionCard 
          title="Supermarché / Achats"
          subtitle="Faites vos courses en ligne et faites-vous livrer par nos chauffeurs."
          icon="shopping"
          onPress={() => navigation.navigate('MarketplaceHub')}
          gradientColors={['rgba(39, 174, 96, 0.1)', 'rgba(0, 0, 0, 0)']}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Yély — Votre Super-App Locale</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  header: {
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: THEME.SPACING.huge,
    marginBottom: THEME.SPACING.massive,
  },
  welcome: {
    fontSize: THEME.FONTS.sizes.h1,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
    marginBottom: THEME.SPACING.xs,
  },
  tagline: {
    fontSize: THEME.FONTS.sizes.h4,
    color: THEME.COLORS.textSecondary,
    fontWeight: THEME.FONTS.weights.medium,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.xl,
  },
  footer: {
    paddingBottom: THEME.SPACING.xxl,
    alignItems: 'center',
  },
  footerText: {
    color: THEME.COLORS.textTertiary,
    fontSize: THEME.FONTS.sizes.micro,
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});

export default ChoiceHome;
