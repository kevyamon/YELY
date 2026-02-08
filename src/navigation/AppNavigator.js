import { createStackNavigator } from '@react-navigation/stack';
import LandingScreen from '../screens/LandingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#121418' } // Deep Asphalt par défaut
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
    </Stack.Navigator>
  );
}