// src/components/ui/ShopLocationModal.jsx
// MODALE DE LOCALISATION BOUTIQUE VENDEUR - Carte, Recherche & Pure GPS
// CSCSM Level: Bank Grade

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList, 
  Keyboard, 
  useColorScheme, 
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import * as Location from 'expo-location';

import THEME from '../../theme/theme';
import GlassModal from './GlassModal';
import GlassInput from './GlassInput';
import MapCard from '../map/MapCard';
import MapService from '../../services/mapService';
import { isLocationInMafereZone, MAFERE_CENTER } from '../../utils/mafereZone';
import { updateUserInfo } from '../../store/slices/authSlice';
import { useUpdateShopLocationMutation } from '../../store/api/usersApiSlice';
import { showToast, showErrorToast } from '../../store/slices/uiSlice';

const { height: screenHeight } = Dimensions.get('window');

const ShopLocationModal = ({ visible, onClose, initialCoords, initialAddress }) => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const mapRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  const [updateShopLocation, { isLoading: isSaving }] = useUpdateShopLocationMutation();

  // Initialisation avec les valeurs existantes
  useEffect(() => {
    if (visible) {
      if (initialCoords && initialCoords[0] !== 0 && initialCoords[1] !== 0) {
        setSelectedCoords({
          longitude: initialCoords[0],
          latitude: initialCoords[1]
        });
        setResolvedAddress(initialAddress || 'Boutique localisée');
      } else {
        setSelectedCoords(null);
        setResolvedAddress('');
      }
      setSearchQuery('');
      setSuggestions([]);
    }
  }, [visible, initialCoords, initialAddress]);

  // Centrage initial de la carte
  useEffect(() => {
    if (visible && selectedCoords && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: selectedCoords.latitude,
          longitude: selectedCoords.longitude
        }, 800);
      }, 500);
    }
  }, [visible, selectedCoords]);

  // Recherche de suggestions avec debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await MapService.getPlaceSuggestions(searchQuery);
        // Filtrer les suggestions pour ne garder que celles dans la zone Maféré
        const validResults = results.filter(item => {
          return isLocationInMafereZone({
            latitude: item.latitude,
            longitude: item.longitude
          });
        });
        setSuggestions(validResults);
      } catch (err) {
        console.warn('[ShopLocationModal] Suggestions error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Sélectionner un lieu suggéré
  const handleSelectSuggestion = useCallback(async (item) => {
    Keyboard.dismiss();
    setSuggestions([]);
    setSearchQuery('');

    const coords = {
      latitude: item.latitude,
      longitude: item.longitude
    };

    setSelectedCoords(coords);
    
    if (mapRef.current) {
      mapRef.current.animateToRegion(coords, 800);
    }

    // Récupérer l'adresse textuelle complète
    setIsResolvingAddress(true);
    try {
      const addr = await MapService.getAddressFromCoordinates(coords.latitude, coords.longitude);
      setResolvedAddress(addr);
    } catch (err) {
      setResolvedAddress(item.mainText || item.description);
    } finally {
      setIsResolvingAddress(false);
    }
  }, []);

  // Détection GPS "Ma position actuelle"
  const handleGPSLocation = async () => {
    setIsLocatingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        dispatch(showToast({
          type: 'warning',
          title: 'Permission GPS',
          message: 'L\'accès à la position a été refusé. Veuillez activer les permissions GPS.'
        }));
        setIsLocatingGPS(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };

      if (!isLocationInMafereZone(coords)) {
        dispatch(showErrorToast({
          title: 'Hors Zone',
          message: 'Votre position actuelle se trouve en dehors de la zone de service Yély.'
        }));
        setIsLocatingGPS(false);
        return;
      }

      setSelectedCoords(coords);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(coords, 800);
      }

      // Géocodage inversé pour un rendu optimal
      setIsResolvingAddress(true);
      const addr = await MapService.getAddressFromCoordinates(coords.latitude, coords.longitude);
      setResolvedAddress(addr);

    } catch (err) {
      console.warn('[ShopLocationModal] GPS error:', err);
      dispatch(showErrorToast({
        title: 'Erreur GPS',
        message: 'Impossible de capter le signal GPS. Vérifiez vos paramètres.'
      }));
    } finally {
      setIsLocatingGPS(false);
      setIsResolvingAddress(false);
    }
  };

  // Soumission
  const handleConfirm = async () => {
    if (!selectedCoords) return;

    if (!resolvedAddress || resolvedAddress.trim() === '') {
      dispatch(showErrorToast({ message: 'Veuillez patienter pendant la résolution de l\'adresse.' }));
      return;
    }

    try {
      const res = await updateShopLocation({
        coordinates: [selectedCoords.longitude, selectedCoords.latitude], // [longitude, latitude]
        address: resolvedAddress.trim()
      }).unwrap();

      // Commencer la fermeture de la modale en premier pour éviter le démontage brutal pendant le cycle
      onClose();

      setTimeout(() => {
        // Mettre à jour le store Redux de l'utilisateur après début de transition
        dispatch(updateUserInfo({
          currentLocation: res.data.currentLocation,
          address: res.data.address
        }));

        dispatch(showToast({
          type: 'success',
          title: 'Localisation enregistrée',
          message: 'L\'emplacement de votre boutique a été défini avec succès.'
        }));
      }, 300);
    } catch (error) {
      console.error('[ShopLocationModal] Save error:', error);
      const msg = error.data?.message || 'Erreur lors de la sauvegarde de la localisation.';
      dispatch(showErrorToast({ message: msg }));
    }
  };

  const markers = useMemo(() => {
    if (!selectedCoords) return [];
    return [{
      id: 'shop_marker',
      latitude: selectedCoords.latitude,
      longitude: selectedCoords.longitude,
      type: 'destination',
      name: 'Boutique',
      icon: 'storefront',
      iconColor: THEME.COLORS.primary
    }];
  }, [selectedCoords]);

  // Style adaptatif
  const modalBgColor = isDarkMode ? 'rgba(18, 20, 24, 0.98)' : 'rgba(255, 255, 255, 0.98)';
  const labelColor = isDarkMode ? THEME.COLORS.textSecondary : 'rgba(0, 0, 0, 0.6)';

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      position="center"
      fullWidth={true}
      style={[styles.modalStyle, { backgroundColor: modalBgColor }]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Localisation de ma boutique</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={THEME.COLORS.champagneGold} />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchWrapper}>
          <GlassInput
            placeholder="Rechercher un lieu ou une adresse..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon="search-outline"
          />
          
          {isSearching && (
            <ActivityIndicator 
              size="small" 
              color={THEME.COLORS.champagneGold} 
              style={styles.searchLoader} 
            />
          )}

          {/* Liste des suggestions de recherche */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.suggestionItem} 
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Ionicons name="location-outline" size={16} color={THEME.COLORS.champagneGold} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionTextMain} numberOfLines={1}>{item.mainText}</Text>
                      <Text style={styles.suggestionTextSub} numberOfLines={1}>{item.secondaryText}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}
        </View>

        {/* Note informative de recommandations */}
        <View style={styles.recommendationBox}>
          <Ionicons name="information-circle" size={18} color={THEME.COLORS.champagneGold} style={styles.infoIcon} />
          <Text style={[styles.recommendationText, { color: labelColor }]}>
            <Text style={{ fontWeight: 'bold', color: THEME.COLORS.primary }}>Recommandé :</Text> Utilisez le bouton "Ma position actuelle" si vous êtes présentement dans votre boutique. Sinon, recherchez l'adresse ci-dessus.
          </Text>
        </View>

        {/* Carte */}
        <View style={styles.mapContainer}>
          <MapCard
            ref={mapRef}
            location={selectedCoords || MAFERE_CENTER}
            markers={markers}
            showUserMarker={!selectedCoords}
            showRecenterButton={true}
            mapTopPadding={10}
            mapBottomPadding={10}
            style={styles.map}
            hidePOIs={false}
          />
          
          {isLocatingGPS && (
            <View style={styles.mapOverlay}>
              <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} />
              <Text style={styles.mapOverlayText}>Acquisition du signal GPS...</Text>
            </View>
          )}
        </View>

        {/* Résolution Adresse */}
        <View style={styles.addressDisplayBox}>
          <Text style={styles.addressDisplayLabel}>Adresse configurée :</Text>
          {isResolvingAddress ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={THEME.COLORS.champagneGold} />
              <Text style={styles.loaderRowText}>Résolution de l'adresse...</Text>
            </View>
          ) : (
            <Text style={styles.addressDisplayText} numberOfLines={2}>
              {resolvedAddress || "Sélectionnez un point GPS..."}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.gpsBtn} 
            onPress={handleGPSLocation}
            disabled={isLocatingGPS || isSaving}
          >
            <Ionicons name="navigate" size={18} color={THEME.COLORS.champagneGold} style={{ marginRight: 6 }} />
            <Text style={styles.gpsBtnText}>Ma position actuelle</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.confirmBtn, 
              (!selectedCoords || isSaving || isResolvingAddress) && styles.confirmBtnDisabled
            ]} 
            onPress={handleConfirm}
            disabled={!selectedCoords || isSaving || isResolvingAddress}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#000" style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>Confirmer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.champagneGold,
    width: '95%',
    maxWidth: 500,
    padding: 18,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 24,
  },
  container: {
    width: '100%',
    maxHeight: screenHeight * 0.82,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  searchWrapper: {
    marginBottom: 10,
    position: 'relative',
    zIndex: 10,
  },
  searchLoader: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: THEME.COLORS.glassModal,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    maxHeight: 180,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suggestionTextMain: {
    color: THEME.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  suggestionTextSub: {
    color: THEME.COLORS.textTertiary,
    fontSize: 10.5,
    marginTop: 1,
  },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  recommendationText: {
    fontSize: 10.5,
    flex: 1,
    lineHeight: 15,
  },
  mapContainer: {
    height: screenHeight * 0.3,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    marginBottom: 12,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  mapOverlayText: {
    color: THEME.COLORS.champagneGold,
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  addressDisplayBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    marginBottom: 14,
  },
  addressDisplayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.COLORS.textTertiary,
    marginBottom: 4,
  },
  addressDisplayText: {
    fontSize: 13,
    color: THEME.COLORS.textPrimary,
    fontWeight: '600',
    lineHeight: 18,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loaderRowText: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    marginLeft: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  gpsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.champagneGold,
    borderRadius: 14,
    paddingVertical: 12,
  },
  gpsBtnText: {
    color: THEME.COLORS.champagneGold,
    fontWeight: '800',
    fontSize: 12.5,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12.5,
  },
});

export default ShopLocationModal;
