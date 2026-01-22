import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getRoutines, addRoutine, deleteRoutine } from '../services/database';
import { auth } from '../services/firebaseConfig'; 
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const [routines, setRoutines] = useState([]);
  const [newRoutineName, setNewRoutineName] = useState('');
  const user = auth.currentUser;

  const loadRoutines = (uid) => {
    const data = getRoutines(uid);
    setRoutines([...data]);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (auth.currentUser) loadRoutines(auth.currentUser.uid);
    });
    if (user) loadRoutines(user.uid);
    return unsubscribe;
  }, [navigation]);

  const handleAddRoutine = () => {
    const uid = auth.currentUser?.uid;
    if (!uid || newRoutineName.trim() === '') return;
    
    const success = addRoutine(uid, newRoutineName, "Entrenamiento", new Date().toLocaleDateString());
    if (success) {
      setNewRoutineName('');
      loadRoutines(uid);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.userLabel}>Usuario: {user?.email}</Text>
      <View style={styles.inputArea}>
        <TextInput 
          style={styles.input} 
          placeholder="Ej: Lunes - Pierna" 
          value={newRoutineName} 
          onChangeText={setNewRoutineName} 
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddRoutine}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('RoutineDetail', { routine: item })}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { deleteRoutine(item.id); loadRoutines(user.uid); }}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f8f8' },
  userLabel: { fontSize: 12, color: '#999', marginBottom: 10 },
  inputArea: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8, marginRight: 10 },
  addButton: { backgroundColor: '#007AFF', borderRadius: 8, padding: 8 },
  card: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', marginBottom: 12, borderRadius: 12, alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold' },
  date: { fontSize: 12, color: '#999' }
});

export default HomeScreen;