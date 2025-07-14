import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateTripScreen from '../screens/CreateTripScreen'; // import CreateTripScreen
import { AuthContext } from '../context/AuthContext';
import TripDetailsScreen from '../screens/TripDetailsScreen';
import EditItineraryScreen from '../screens/EditItineraryScreen';
import TripGalleryScreen from '../screens/TripGalleryScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null; // Replace with splash screen if you want
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
            <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
            <Stack.Screen name="EditItinerary" component={EditItineraryScreen} />
            <Stack.Screen name="TripGallery"component={TripGalleryScreen} options={{ headerShown: false }}/>


          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default AppNavigator;
