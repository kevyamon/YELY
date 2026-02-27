// src/screens/ride/PancarteScreen.jsx
// ECRAN DE RENCONTRE - Haute visibilite pour identification
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCurrentRide } from '../../store/slices/rideSlice';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

const PancarteScreen = ({ navigation }) => {
  const user = useSelector(selectCurrentUser);
  const currentRide = useSelector(selectCurrentRide);
  
  const vehiclePlate = user?.vehicle?.plate || 'NON SPECIFIE';
  const vehicleColor = user?.vehicle?.color || 'Non specifie';
  const vehicleModel = user?.vehicle?.model || 'Vehicule';

  // Fermeture automatique de la pancarte dès que le statut passe en cours
  // Ceci est déclenché silencieusement par le Geofencing dans DriverHome
  useEffect(() => {
    if (currentRide && currentRide.status === 'ongoing') {
      navigation.goBack();
    }
  }, [currentRide?.status, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={36} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.instructionText}>PLAQUE D'IMMATRICULATION</Text>
        
        <View style={styles.plateContainer}>
          <Text style={styles.plateText} adjustsFontSizeToFit numberOfLines={1}>
            {vehiclePlate}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailBadge}>
            <Ionicons name="color-palette" size={20} color={THEME.COLORS.champagneGold} />
            <Text style={styles.detailText}>{vehicleColor}</Text>
          </View>
          <View style={styles.detailBadge}>
            <Ionicons name="car-sport" size={20} color={THEME.COLORS.champagneGold} />
            <Text style={styles.detailText}>{vehicleModel}</Text>
          </View>
        </View>

        <Text style={styles.footerText}>Cet ecran se fermera automatiquement une fois le client a bord.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', 
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: THEME.COLORS.champagneGold,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 40,
    textAlign: 'center',
  },
  plateContainer: {
    width: width * 0.9,
    backgroundColor: '#FFFFFF',
    borderWidth: 8,
    borderColor: THEME.COLORS.champagneGold,
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  plateText: {
    color: '#000000',
    fontSize: 70,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  detailsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 50,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  detailText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  footerText: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    width: '80%',
  },
});

export default PancarteScreen;