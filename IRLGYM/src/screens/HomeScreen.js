import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { addRoutine, deleteRoutine } from '../services/database';
import { auth } from '../services/firebaseConfig'; 
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { Colors } from '../styles/theme';
import { useRoutines } from '../hooks/useRoutines';

const HomeScreen = ({ navigation }) => {
  const [newRoutineName, setNewRoutineName] = useState('');
  const { routines, loadRoutines } = useRoutines();

  // Mejorado: Solo una fuente de verdad para la carga
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRoutines);
    return unsubscribe;
  }, [navigation, loadRoutines]);

  const handleAddRoutine = () => {
    const trimmedName = newRoutineName.trim();
    if (!trimmedName) return; 
    
    if (addRoutine(auth.currentUser.uid, trimmedName)) {
      setNewRoutineName('');
      loadRoutines();
    }
  };

  const handleDelete = (id, name) => {
    const performDelete = () => {
      deleteRoutine(id);
      loadRoutines();
    };

    if (Platform.OS === 'web') {
      if (confirm(`¿Borrar "${name}"?`)) performDelete();
    } else {
      Alert.alert("Borrar", `¿Eliminar "${name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: performDelete }
      ]);
    }
  };

  return (
    <View style={globalStyles.container}>
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <TextInput 
          style={[globalStyles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]} 
          placeholder="Nueva rutina..." 
          value={newRoutineName} 
          onChangeText={setNewRoutineName}
          maxLength={25} // Evita nombres que rompan la UI
        />
        <TouchableOpacity 
          style={[globalStyles.buttonPrimary, { width: 55, borderRadius: 12 }]} 
          onPress={handleAddRoutine}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={globalStyles.card} 
            onPress={() => navigation.navigate('RoutineDetail', { routine: item })}
          >
            <View style={{ flex: 1 }}>
              <Text style={globalStyles.subtitle}>{item.name}</Text>
              <Text style={globalStyles.caption}>📅 {item.date}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ padding: 5 }}>
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: Colors.gray, marginTop: 40 }}>
            No hay rutinas. ¡Crea una!
          </Text>
        }
      />
    </View>
  );
};

export default HomeScreen;