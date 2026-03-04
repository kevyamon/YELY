// src/components/admin/PoiFormModal.jsx [NOUVEAU]
// FORMULAIRE DE LIEUX - Ajout et Édition
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { useCreatePOIMutation, useUpdatePOIMutation } from '../../store/api/poiApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GlassInput from '../ui/GlassInput';
import GoldButton from '../ui/GoldButton';
import IconPickerModal from './IconPickerModal';

const suggestColor = (iconName) => {
  const iconKey = iconName.toLowerCase();
  if (iconKey.includes('bus') || iconKey.includes('car') || iconKey.includes('airplane') || iconKey.includes('train') || iconKey.includes('boat')) return '#3498db';
  if (iconKey.includes('restaurant') || iconKey.includes('cafe') || iconKey.includes('pizza') || iconKey.includes('nutrition')) return '#e67e22';
  if (iconKey.includes('medical') || iconKey.includes('hospital') || iconKey.includes('medkit') || iconKey.includes('pulse')) return '#e74c3c';
  if (iconKey.includes('cart') || iconKey.includes('basket') || iconKey.includes('shop') || iconKey.includes('bag')) return '#9b59b6';
  if (iconKey.includes('tree') || iconKey.includes('leaf') || iconKey.includes('park') || iconKey.includes('flower')) return '#2ecc71';
  if (iconKey.includes('school') || iconKey.includes('library') || iconKey.includes('book')) return '#f1c40f';
  return THEME.COLORS.champagneGold;
};

const PoiFormModal = ({ visible, onClose, editingPoi }) => {
  const dispatch = useDispatch();
  const [isIconPickerVisible, setIsIconPickerVisible] = useState(false);

  const [createPOI, { isLoading: isCreating }] = useCreatePOIMutation();
  const [updatePOI, { isLoading: isUpdating }] = useUpdatePOIMutation();

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    icon: 'location',
    iconColor: THEME.COLORS.champagneGold
  });

  useEffect(() => {
    if (visible) {
      if (editingPoi) {
        setFormData({
          name: editingPoi.name,
          latitude: editingPoi.latitude.toString(),
          longitude: editingPoi.longitude.toString(),
          icon: editingPoi.icon,
          iconColor: editingPoi.iconColor
        });
      } else {
        setFormData({
          name: '',
          latitude: '',
          longitude: '',
          icon: 'location',
          iconColor: THEME.COLORS.champagneGold
        });
      }
    }
  }, [visible, editingPoi]);

  const handleIconSelect = (iconName) => {
    setFormData(prev => ({
      ...prev,
      icon: iconName,
      iconColor: suggestColor(iconName)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.latitude || !formData.longitude) {
      dispatch(showToast({ message: 'Veuillez remplir tous les champs', type: 'error' }));
      return;
    }

    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      if (editingPoi) {
        await updatePOI({ id: editingPoi._id, ...payload }).unwrap();
        dispatch(showToast({ message: 'Lieu mis à jour avec succès', type: 'success' }));
      } else {
        await createPOI(payload).unwrap();
        dispatch(showToast({ message: 'Nouveau lieu ajouté', type: 'success' }));
      }
      onClose();
    } catch (err) {
      dispatch(showToast({ message: err.data?.message || 'Erreur lors de l\'enregistrement', type: 'error' }));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{editingPoi ? 'Éditer le lieu' : 'Ajouter un lieu'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={THEME.COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <GlassInput
              placeholder="Nom du lieu (ex: Pharmacie Centrale)"
              value={formData.name}
              onChangeText={(val) => setFormData(p => ({ ...p, name: val }))}
              icon="text-outline"
            />
            
            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <GlassInput
                  placeholder="Latitude"
                  keyboardType="numeric"
                  value={formData.latitude}
                  onChangeText={(val) => setFormData(p => ({ ...p, latitude: val }))}
                  icon="compass-outline"
                />
              </View>
              <View style={styles.flexHalf}>
                <GlassInput
                  placeholder="Longitude"
                  keyboardType="numeric"
                  value={formData.longitude}
                  onChangeText={(val) => setFormData(p => ({ ...p, longitude: val }))}
                  icon="compass-outline"
                />
              </View>
            </View>

            <Text style={styles.label}>Icône & Représentation</Text>
            
            <TouchableOpacity 
              style={styles.iconSelectorBtn} 
              activeOpacity={0.8}
              onPress={() => setIsIconPickerVisible(true)}
            >
              <View style={[styles.iconPreviewBox, { backgroundColor: `${formData.iconColor}15`, borderColor: formData.iconColor }]}>
                <Ionicons name={formData.icon} size={32} color={formData.iconColor} />
              </View>
              <View style={styles.iconSelectorTexts}>
                <Text style={styles.iconNameText}>{formData.icon}</Text>
                <Text style={styles.iconInstructionText}>Appuyez pour changer l'icône</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={THEME.COLORS.textTertiary} />
            </TouchableOpacity>

            <View style={styles.spacer} />

            <GoldButton
              title={editingPoi ? "Mettre à jour" : "Ajouter à la carte"}
              onPress={handleSubmit}
              loading={isCreating || isUpdating}
            />
          </ScrollView>
        </View>
      </View>

      <IconPickerModal 
        visible={isIconPickerVisible} 
        onClose={() => setIsIconPickerVisible(false)} 
        onSelect={handleIconSelect} 
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  content: { backgroundColor: THEME.COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.champagneGold },
  closeBtn: { padding: 4, backgroundColor: THEME.COLORS.glassLight, borderRadius: 20 },
  scrollContent: { paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  flexHalf: { width: '48%' },
  label: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 25, marginBottom: 15, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  iconSelectorBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.glassDark, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: THEME.COLORS.glassBorder },
  iconPreviewBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  iconSelectorTexts: { flex: 1, marginLeft: 15 },
  iconNameText: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  iconInstructionText: { color: THEME.COLORS.champagneGold, fontSize: 12 },
  spacer: { height: 30 }
});

export default PoiFormModal;