import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { initDatabase } from './src/services/database';
import AppNavigator from './src/navigation/AppNavigator';
import { StatsProvider } from './src/context/StatsContext';

export default function App() {
  useEffect(() => {
    initDatabase(); 
  }, []);

  return (
    <StatsProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StatsProvider>
  );
}