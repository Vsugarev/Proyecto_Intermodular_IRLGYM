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
  const user = auth.currentUser;

  // Solo usamos el focus para recargar, esto evita lecturas dobles innecesarias
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRoutines);
    return unsubscribe;
  }, [navigation, loadRoutines]);

  const handleAddRoutine = () => {
    if (!newRoutineName.trim()) return; 
    
    const success = addRoutine(user.uid, newRoutineName.trim());
    if (success) {
      setNewRoutineName('');
      loadRoutines();
    }
  };

  const handleDelete = (id, name) => {
    const msg = `¿Seguro que quieres borrar "${name}"?`;
    if (Platform.OS === 'web') {
      if (confirm(msg)) {
        deleteRoutine(id);
        loadRoutines();
      }
    } else {
      Alert.alert("Borrar Rutina", msg, [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: () => {
          deleteRoutine(id);
          loadRoutines();
        }}
      ]);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={[globalStyles.caption, { marginBottom: 10 }]}>Sesión: {user?.email}</Text>
      
      <View style={[globalStyles.row, { marginBottom: 20 }]}>
        <TextInput 
          style={[globalStyles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]} 
          placeholder="Ej: Empuje, Pierna..." 
          value={newRoutineName} 
          onChangeText={setNewRoutineName}
          maxLength={25}
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
              <Text style={globalStyles.caption}>Creada: {item.date}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ padding: 5 }}>
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: Colors.gray, marginTop: 40 }}>
            No tienes rutinas aún. ¡Crea la primera arriba!
          </Text>
        }
      />
    </View>
  );
};

export default HomeScreen;