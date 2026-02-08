import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { YelyTheme } from '../theme/theme';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const [visible, setVisible] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  return (
    <View style={styles.container}>
      {/* 1. LOGO & SLOGAN */}
      <View style={styles.header}>
        <Text variant="displayLarge" style={styles.title}>YÉLY</Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          L'EXCELLENCE NOCTURNE À VOTRE PORTÉE
        </Text>
      </View>

      {/* 2. BOUTON D'ACTION PRINCIPAL */}
      <View style={styles.footer}>
        <Button 
          mode="contained" 
          onPress={showModal}
          style={styles.mainButton}
          labelStyle={styles.buttonLabel}
        >
          COMMENCER L'EXPÉRIENCE
        </Button>
      </View>

      {/* 3. MODALE DE CHOIX (GLASSMORPHISM) */}
      <Portal>
        <Modal 
          visible={visible} 
          onDismiss={hideModal} 
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            VOUS ÊTES ?
          </Text>
          
          <Button 
            mode="outlined" 
            onPress={() => { hideModal(); /* Navigation vers Register plus tard */ }}
            style={styles.choiceButton}
            textColor={YelyTheme.colors.primary}
          >
            PASSAGER (RIDER)
          </Button>

          <Button 
            mode="contained" 
            onPress={() => { hideModal(); /* Navigation vers Register plus tard */ }}
            style={[styles.choiceButton, { backgroundColor: YelyTheme.colors.primary }]}
            labelStyle={{ color: '#121418', fontWeight: 'bold' }}
          >
            CHAUFFEUR (DRIVER)
          </Button>
          
          <Text onPress={hideModal} style={styles.cancelText}>ANNULER</Text>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YelyTheme.colors.background,
    justifyContent: 'space-between',
    padding: 30,
  },
  header: {
    marginTop: 100,
    alignItems: 'center',
  },
  title: {
    color: YelyTheme.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  subtitle: {
    color: YelyTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 2,
  },
  footer: {
    marginBottom: 50,
  },
  mainButton: {
    borderRadius: 50,
    paddingVertical: 10,
    backgroundColor: YelyTheme.colors.primary,
  },
  buttonLabel: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#121418',
  },
  modalContainer: {
    backgroundColor: 'rgba(18, 20, 24, 0.95)', // Transparence Luxe
    padding: 30,
    margin: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)', // Bordure Or Champagne
    alignItems: 'center',
  },
  modalTitle: {
    color: YelyTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 30,
    letterSpacing: 2,
  },
  choiceButton: {
    width: '100%',
    marginVertical: 10,
    borderRadius: 15,
    borderColor: YelyTheme.colors.primary,
  },
  cancelText: {
    color: YelyTheme.colors.textSecondary,
    marginTop: 20,
    fontSize: 12,
    textDecorationLine: 'underline',
  }
});