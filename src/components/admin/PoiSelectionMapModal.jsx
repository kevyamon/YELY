// src/components/admin/PoiSelectionMapModal.jsx
// SÉLECTEUR GÉOSPATIAL HYBRIDE (API + Carte)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import ENV from '../../config/env';
import { showToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import { MAFERE_CENTER } from '../../utils/mafereZone';
import MapCard from '../map/MapCard';
import GlassInput from '../ui/GlassInput';
import GoldButton from '../ui/GoldButton';

const PoiSelectionMapModal = ({ visible, onClose, onSelect }) => {
  const dispatch = useDispatch();
  const mapCardRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [detectedName, setDetectedName] = useState('');
  const [currentCenter, setCurrentCenter] = useState(MAFERE_CENTER);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const url = `https://us1.locationiq.com/v1/search?key=${ENV.LOCATIONIQ_TOKEN}&q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const shortName = data[0].display_name.split(',')[0];
        
        setDetectedName(shortName);
        setCurrentCenter({ latitude: lat, longitude: lon });
        
        if (mapCardRef.current) {
          mapCardRef.current.animateToRegion({ latitude: lat, longitude: lon }, 1000);
        }
      } else {
        dispatch(showToast({ message: 'Aucun lieu correspondant trouvé', type: 'error' }));
      }
    } catch (err) {
      dispatch(showToast({ message: 'Erreur lors de la recherche', type: 'error' }));
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegionChange = (e) => {
    if (e?.geometry?.coordinates) {
      const [longitude, latitude] = e.geometry.coordinates;
      setCurrentCenter({ latitude, longitude });
    }
  };

  const handleValidation = () => {
    onSelect({
      name: detectedName || searchQuery || 'Nouveau Lieu',
      latitude: currentCenter.latitude,
      longitude: currentCenter.longitude
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <GlassInput
              placeholder="Rechercher (ex: Pharmacie...)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon="search-outline"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={handleSearch} style={styles.searchActionBtn}>
            {isSearching ? (
               <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
            ) : (
               <Ionicons name="paper-plane" size={20} color={THEME.COLORS.champagneGold} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapCard
            ref={mapCardRef}
            location={currentCenter}
            showUserMarker={false}
            showRecenterButton={false}
            mapTopPadding={50}
            mapBottomPadding={150}
            onRegionDidChange={handleRegionChange}
          />
          
          <View style={styles.crosshairWrapper} pointerEvents="none">
            <Ionicons name="add" size={42} color={THEME.COLORS.danger} style={styles.crosshairIcon} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.coordText}>
            Lat: {currentCenter.latitude.toFixed(6)} | Lng: {currentCenter.longitude.toFixed(6)}
          </Text>
          <GoldButton title="Capturer cette position" onPress={handleValidation} />
        </View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 50, paddingBottom: 15, backgroundColor: THEME.COLORS.background, zIndex: 10, ...THEME.SHADOWS.medium },
  closeBtn: { padding: 8, marginRight: 5 },
  searchContainer: { flex: 1, marginRight: 10 },
  searchActionBtn: { padding: 12, backgroundColor: THEME.COLORS.glassDark, borderRadius: 12, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  mapContainer: { flex: 1, position: 'relative' },
  
  // CORRECTION CRITIQUE : Ajout de zIndex et elevation pour forcer l'affichage AU-DESSUS du moteur OpenGL natif de la carte
  crosshairWrapper: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 9999, 
    elevation: 9999 
  },
  
  crosshairIcon: { textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: THEME.COLORS.glassModal, padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: THEME.COLORS.glassBorder, ...THEME.SHADOWS.strong },
  coordText: { textAlign: 'center', color: THEME.COLORS.textSecondary, fontSize: 13, marginBottom: 15, fontWeight: '600' }
});

export default PoiSelectionMapModal;