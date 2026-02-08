// src/navigation/AppNavigator.jsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreAuth } from '../store/slices/authSlice';
import { ANIMATIONS, COLORS } from '../theme/theme';

// Screens - CORRECTION DES CHEMINS BASÉE SUR TES FICHIERS
import LandingScreen from '../screens/LandingScreen'; // Corrigé (était auth/LandingPage)
import SplashScreen from '../screens/SplashScreen';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';

// Placeholder pour les écrans non fournis dans ta liste actuelle
// Assure-toi que ces fichiers existent ou commente-les si nécessaire
// import DriverHome from '../screens/driver/DriverHome';
// import RiderHome from '../screens/rider/RiderHome';
// etc...

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: COLORS.deepAsphalt },
  animation: 'fade_from_bottom',
  animationDuration: ANIMATIONS.duration.normal,
};

// Composants temporaires pour éviter le crash si les fichiers manquent
const PlaceholderScreen = ({ name }) => (
    <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: COLORS.deepAsphalt}}>
        <Text style={{color:'white'}}>Ecran {name} en construction</Text>
    </View>
);

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, userInfo } = useSelector((state) => state.auth);
  const [isReady, setIsReady] = useState(false);

  // Restaurer l'authentification depuis AsyncStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem('userInfo'),
          AsyncStorage.getItem('token'),
        ]);

        if (storedUser && storedToken) {
          dispatch(restoreAuth({
            user: JSON.parse(storedUser),
            token: storedToken,
          }));
        }
      } catch (e) {
        console.error('[Auth] Erreur de restauration:', e);
      } finally {
        setTimeout(() => setIsReady(true), 1500);
      }
    };

    restoreSession();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  const getHomeScreen = () => {
    if (!userInfo) return 'Landing';
    // Sécurité si userInfo.role n'est pas défini
    const role = userInfo.role || 'rider';
    
    switch (role) {
      case 'superAdmin':
      case 'admin':
        return 'AdminDashboard';
      case 'driver':
        return 'DriverHome';
      case 'rider':
      default:
        return 'RiderHome'; // Assure-toi que cette route existe
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={screenOptions}
        initialRouteName={isAuthenticated ? getHomeScreen() : 'Landing'}
      >
        {!isAuthenticated ? (
          // ═══ ÉCRANS NON AUTHENTIFIÉS ═══
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginPage} />
            <Stack.Screen name="Register" component={RegisterPage} />
          </>
        ) : (
          // ═══ ÉCRANS AUTHENTIFIÉS ═══
          <>
             {/* Remplacer par tes vrais composants une fois importés */}
             {/* <Stack.Screen name="RiderHome" component={RiderHome} /> */}
             
             {/* Pour l'instant, je redirige vers Landing si RiderHome manque, pour éviter l'erreur */}
             <Stack.Screen name="RiderHome" component={LandingScreen} /> 
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Petit fix pour utiliser View et Text dans le placeholder si besoin
import { Text, View } from 'react-native';

export default AppNavigator;