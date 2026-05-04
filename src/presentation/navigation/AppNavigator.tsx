import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../infrastructure/config/firebase';
import { AuthService } from '../../application/service/AuthService';

import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { RoutineEditScreen } from '../screens/routine/RoutineEditScreen';
import { ExerciseLibraryScreen } from '../screens/routine/ExerciseLibraryScreen';
import { ExerciseCreateScreen } from '../screens/routine/ExerciseCreateScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditRoutine" component={RoutineEditScreen} options={{ title: 'Editar Rutina' }} />
      <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} options={{ title: 'Biblioteca' }} />
      {/* Nueva pantalla de creación */}
      <Stack.Screen name="ExerciseCreate" component={ExerciseCreateScreen} options={{ title: 'Nuevo Ejercicio' }} />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Aseguramos que el perfil local existe antes de entrar a la app
        await AuthService.syncUserToLocal(currentUser.uid);
      }
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Inicio" component={HomeStack} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};