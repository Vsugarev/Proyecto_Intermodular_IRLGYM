import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Platform } from 'react-native';
import { addRoutine, deleteRoutine } from '../services/database';
import { auth } from '../services/firebaseConfig'; 
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { Colors } from '../styles/theme';
import { useRoutines } from '../hooks/useRoutines';

const HomeScreen = ({ navigation }) => {
  const [newRoutineName, setNewRoutineName] = useState('');
  const { routines, loadRoutines } = useRoutines();
  const user = auth.currentUser;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRoutines);
    loadRoutines();
    return unsubscribe;
  }, [navigation, loadRoutines]);

  const handleAddRoutine = () => {
    if (!newRoutineName.trim()) return alert("Escribe un nombre.");
    const success = addRoutine(user.uid, newRoutineName, "Entrenamiento", new Date().toLocaleDateString());
    if (success) {
      setNewRoutineName('');
      loadRoutines();
    }
  };

  const handleDelete = (id, name) => {
    const proceed = Platform.OS === 'web' ? confirm(`¿Borrar "${name}"?`) : true;
    if (proceed) {
      deleteRoutine(id);
      loadRoutines();
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.caption}>Usuario: {user?.email}</Text>
      <View style={[globalStyles.row, { marginVertical: 15 }]}>
        <TextInput 
          style={[globalStyles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]} 
          placeholder="Nueva rutina..." 
          value={newRoutineName} 
          onChangeText={setNewRoutineName} 
        />
        <TouchableOpacity style={[globalStyles.buttonPrimary, { width: 50 }]} onPress={handleAddRoutine}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={globalStyles.card} onPress={() => navigation.navigate('RoutineDetail', { routine: item })}>
            <View style={{ flex: 1 }}>
              <Text style={globalStyles.subtitle}>{item.name}</Text>
              <Text style={globalStyles.caption}>{item.date}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
              <Ionicons name="trash-outline" size={22} color={Colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default HomeScreen;