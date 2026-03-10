// src/screens/report/ReportScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import GoldButton from '../../components/ui/GoldButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useSubmitReportMutation } from '../../store/api/reportsApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const formatImageForUpload = (imageAsset, index) => {
  let localUri = imageAsset.uri;
  
  if (Platform.OS === 'android' && !localUri.includes('file://') && !localUri.startsWith('content://')) {
    localUri = `file://${localUri}`;
  } else if (Platform.OS === 'ios') {
    localUri = localUri.replace('file://', '');
  }

  const filename = imageAsset.fileName || `capture_${Date.now()}_${index}.jpg`;
  const type = imageAsset.mimeType || 'image/jpeg';

  return {
    uri: localUri,
    name: filename,
    type: type,
  };
};

const ReportScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [submitReport, { isLoading }] = useSubmitReportMutation();

  const pickImage = async () => {
    if (images.length >= 3) return;
    const res = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.5 
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setImages([...images, res.assets[0]]);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const replaceImage = async (indexToReplace) => {
    const res = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.5 
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const newImages = [...images];
      newImages[indexToReplace] = res.assets[0];
      setImages(newImages);
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    if (!message.trim()) {
      return dispatch(showErrorToast({ title: 'Message vide', message: 'Decrivez le probleme.' }));
    }
    
    const formData = new FormData();
    formData.append('message', message);
    
    images.forEach((img, index) => {
      const formattedImg = formatImageForUpload(img, index);
      formData.append('captures', formattedImg);
    });

    try {
      await submitReport(formData).unwrap();
      dispatch(showSuccessToast({ title: 'Envoye', message: 'L\'administration traitera votre demande.' }));
      navigation.goBack();
    } catch (e) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Echec de l\'envoi du signalement.' }));
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Signaler un probleme</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Decrivez votre souci</Text>
        <TextInput 
          style={styles.input} 
          multiline numberOfLines={6} 
          value={message} 
          onChangeText={setMessage} 
          placeholder="Detaillez le probleme rencontre..."
          placeholderTextColor={THEME.COLORS.textTertiary}
          editable={!isLoading} 
        />
        
        <Text style={styles.label}>Captures d'ecran ({images.length}/3)</Text>
        <View style={styles.imageRow}>
          {images.map((img, i) => (
            <View key={i} style={styles.imageContainer}>
              <Image source={{ uri: img.uri }} style={styles.preview} />
              
              {!isLoading && ( 
                <>
                  <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(i)}>
                    <Ionicons name="close-circle" size={24} color={THEME.COLORS.danger} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.replaceIcon} onPress={() => replaceImage(i)}>
                    <Ionicons name="sync-circle" size={24} color={THEME.COLORS.primary} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}

          {images.length < 3 && !isLoading && (
            <TouchableOpacity style={styles.addBtn} onPress={pickImage}>
              <Ionicons name="camera" size={30} color={THEME.COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        <GoldButton 
          title={isLoading ? "ENVOI EN COURS..." : "ENVOYER LE SIGNALEMENT"} 
          onPress={handleSubmit} 
          isLoading={isLoading} 
          disabled={isLoading} 
          style={styles.btn} 
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50 },
  title: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  content: { padding: 20 },
  label: { color: THEME.COLORS.textSecondary, marginBottom: 10, fontSize: 14 },
  input: { backgroundColor: THEME.COLORS.glassSurface, borderRadius: 15, padding: 15, color: THEME.COLORS.textPrimary, textAlignVertical: 'top', marginBottom: 25, borderWidth: 1, borderColor: THEME.COLORS.border },
  imageRow: { flexDirection: 'row', marginBottom: 30 },
  imageContainer: { position: 'relative', marginRight: 15 },
  preview: { width: 80, height: 80, borderRadius: 10 },
  removeIcon: { position: 'absolute', top: -10, right: -10, backgroundColor: THEME.COLORS.background, borderRadius: 12 },
  replaceIcon: { position: 'absolute', bottom: -10, right: -10, backgroundColor: THEME.COLORS.background, borderRadius: 12 },
  addBtn: { width: 80, height: 80, borderRadius: 10, backgroundColor: THEME.COLORS.glassSurface, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: THEME.COLORS.primary },
  btn: { marginTop: 20 }
});

export default ReportScreen;