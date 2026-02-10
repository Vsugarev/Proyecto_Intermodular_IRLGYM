import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { initDatabase } from './src/services/database';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    initDatabase(); 
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}