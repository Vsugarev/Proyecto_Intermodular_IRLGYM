import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { initDatabase } from './src/infrastructure/database/sqlite';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        // Inicializamos la DB antes de mostrar nada
        await initDatabase();
        setIsReady(true);
      } catch (error) {
        console.error("Error al iniciar la base de datos:", error);
      }
    }
    setup();
  }, []);

  // Mientras la base de datos se crea, mostramos una pantalla de carga
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  // IMPORTANTE: NavigationContainer debe envolver al Navigator
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}