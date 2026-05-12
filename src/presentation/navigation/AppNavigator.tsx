import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../infrastructure/config/firebase';
import { AuthService } from '../../application/service/AuthService';
import { Theme } from '../styles/theme';

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

const commonStackOptions = {
  headerStyle: { backgroundColor: Theme.colors.card },
  headerTintColor: Theme.colors.text,
  headerTitleStyle: { fontWeight: '800' as const, fontSize: 18 },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

const HomeStack = () => (
  <Stack.Navigator screenOptions={commonStackOptions}>
    <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EditRoutine" component={RoutineEditScreen} options={{ title: 'Entrenamiento' }} />
    <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} options={{ title: 'Biblioteca' }} />
    <Stack.Screen name="ExerciseCreate" component={ExerciseCreateScreen} options={{ title: 'Nuevo Ejercicio' }} />
    <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Detalle' }} />
    <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={{ title: 'Resumen' }} />
  </Stack.Navigator>
);

const ExercisesStack = () => (
  <Stack.Navigator screenOptions={commonStackOptions}>
    <Stack.Screen name="LibraryMain" component={ExerciseLibraryScreen} options={{ title: 'Biblioteca' }} />
    <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Detalle' }} />
    <Stack.Screen name="ExerciseCreate" component={ExerciseCreateScreen} options={{ title: 'Nuevo Ejercicio' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={commonStackOptions}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={{ title: 'Historial' }} />
    <Stack.Screen name="EditRoutine" component={RoutineEditScreen} options={{ title: 'Editar' }} />
    <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Detalle' }} />
  </Stack.Navigator>
);

const SkillsStack = () => (
  <Stack.Navigator screenOptions={commonStackOptions}>
    <Stack.Screen name="SkillsMain" component={SkillsScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
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
          if (route.name === 'Entrenar') iconName = focused ? 'fitness' : 'fitness-outline';
          else if (route.name === 'Ejercicios') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Progreso') iconName = focused ? 'trophy' : 'trophy-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Theme.colors.success,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarStyle: { 
          backgroundColor: Theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: Theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        }
      })}
    >
      <Tab.Screen name="Entrenar" component={HomeStack} />
      <Tab.Screen name="Ejercicios" component={ExercisesStack} />
      <Tab.Screen name="Progreso" component={SkillsStack} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
};