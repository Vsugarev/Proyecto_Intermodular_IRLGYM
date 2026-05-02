import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { RoutineEditScreen } from '../screens/routine/RoutineEditScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="EditRoutine" 
        component={RoutineEditScreen} 
        options={{ title: 'Editar Rutina' }} 
      />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen 
        name="Inicio" 
        component={HomeStack} 
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>
  );
};