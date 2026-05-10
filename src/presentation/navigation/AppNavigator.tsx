import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../infrastructure/config/firebase';
import { AuthService } from '../../application/service/AuthService';

import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { RoutineEditScreen } from '../screens/routine/RoutineEditScreen';
import { ExerciseLibraryScreen } from '../screens/routine/ExerciseLibraryScreen';
import { ExerciseCreateScreen } from '../screens/routine/ExerciseCreateScreen';
import { ExerciseDetailScreen } from '../screens/routine/ExerciseDetailScreen';
import { RoutineDetailScreen } from '../screens/routine/RoutineDetailScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { SkillsScreen } from '../screens/skills/SkillsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditRoutine" component={RoutineEditScreen} options={{ title: 'Editar Rutina' }} />
      <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} options={{ title: 'Biblioteca' }} />
      <Stack.Screen name="ExerciseCreate" component={ExerciseCreateScreen} options={{ title: 'Nuevo Ejercicio' }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Detalle de Ejercicio' }} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={{ title: 'Detalle de Rutina' }} />
    </Stack.Navigator>
  );
};
const ExercisesStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LibraryMain" component={ExerciseLibraryScreen} options={{ title: 'Biblioteca' }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Detalle de Ejercicio' }} />
      <Stack.Screen name="ExerciseCreate" component={ExerciseCreateScreen} options={{ title: 'Nuevo Ejercicio' }} />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={{ title: 'Resumen de Entrenamiento' }} />
      <Stack.Screen name="EditRoutine" component={RoutineEditScreen} options={{ title: 'Editar Rutina' }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Detalle de Ejercicio' }} />
    </Stack.Navigator>
  );
};


const SkillsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SkillsMain" component={SkillsScreen} options={{ headerShown: false }} />
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
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Entrenar') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Ejercicios') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Progreso') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#28a745',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 5, height: 60 }
      })}
    >
      <Tab.Screen name="Entrenar" component={HomeStack} />
      <Tab.Screen name="Ejercicios" component={ExercisesStack} />
      <Tab.Screen name="Progreso" component={SkillsStack} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
};