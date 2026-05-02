import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { auth } from '../../../infrastructure/config/firebase';

export const HomeScreen = ({ navigation }: any) => {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Recargar rutinas cada vez que la pantalla gana el foco
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (user) {
        loadWorkouts(user.uid);
      } else {
        setLoading(false);
      }
    }, [])
  );

  const loadWorkouts = async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      const data = await WorkoutService.getUserWorkouts(uid);
      setWorkouts(data);
    } catch (e) {
      console.error("Error cargando rutinas:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      const defaultName = "Nueva Rutina " + new Date().toLocaleDateString();
      // Llamada limpia al servicio coordinado
      const newRoutine = await WorkoutService.createWorkout(defaultName); 
      
      // Navegamos a la pantalla de edición pasándole el objeto real[cite: 5]
      navigation.navigate('EditRoutine', { routine: newRoutine });
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo crear la rutina");
    }
  };

  const renderRoutineItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.routineCard} 
      onPress={() => navigation.navigate('EditRoutine', { routine: item })}
    >
      <View>
        <Text style={styles.routineName}>{item.name || "Sin nombre"}</Text>
        <Text style={styles.routineDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.arrow}>{'>'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Guerrero</Text>
      <Text style={styles.userText}>Hola, {auth.currentUser?.email}</Text>
      
      <Text style={styles.subtitle}>Tus Rutinas</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={renderRoutineItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No tienes rutinas aún. ¡Empieza una!</Text>}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity style={styles.createBtn} onPress={handleCreateNew}>
        <Text style={styles.btnText}>+ EMPEZAR NUEVA RUTINA</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginTop: 40 },
  userText: { fontSize: 14, color: '#666', marginBottom: 20 },
  subtitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  listContainer: { paddingBottom: 20 },
  routineCard: { 
    backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 12, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2
  },
  routineName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  routineDate: { fontSize: 12, color: '#999', marginTop: 4 },
  arrow: { fontSize: 18, color: '#ccc' },
  createBtn: { backgroundColor: '#28a745', paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontStyle: 'italic' }
});