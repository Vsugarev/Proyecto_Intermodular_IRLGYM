import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { getExercisesByRoutine, updateExerciseStats, deleteExerciseFromRoutine } from '../services/database';
import { Ionicons } from '@expo/vector-icons';

const RoutineDetailScreen = ({ route, navigation }) => {
  const { routine } = route.params;
  const [exercises, setExercises] = useState([]);

  const loadExercises = () => {
    const data = getExercisesByRoutine(routine.id);
    setExercises(data);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadExercises);
    loadExercises();
    return unsubscribe;
  }, [navigation]);

  const handleUpdate = (id, series, reps) => {
    updateExerciseStats(id, series, reps);
    // No hace falta recargar toda la lista para que sea más fluido al escribir
  };

  const handleDelete = (id) => {
    deleteExerciseFromRoutine(id);
    loadExercises();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.exerciseCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exerciseName}>{item.exercise_name}</Text>
              
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Series</Text>
                  <TextInput 
                    style={styles.input}
                    keyboardType="numeric"
                    defaultValue={item.series}
                    onChangeText={(text) => handleUpdate(item.id, text, item.reps)}
                  />
                </View>
                
                <Text style={styles.x}>X</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reps</Text>
                  <TextInput 
                    style={styles.input}
                    keyboardType="numeric"
                    defaultValue={item.reps}
                    onChangeText={(text) => handleUpdate(item.id, item.series, text)}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Pulsa el botón + para añadir ejercicios</Text>}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('MainApp', { screen: 'Biblioteca', params: { routineId: routine.id } })}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 15 },
  exerciseCard: { 
    backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, 
    flexDirection: 'row', alignItems: 'center', elevation: 3 
  },
  exerciseName: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputGroup: { alignItems: 'center', marginRight: 10 },
  label: { fontSize: 10, color: '#999', marginBottom: 2, textTransform: 'uppercase' },
  input: { 
    backgroundColor: '#f1f1f1', width: 50, textAlign: 'center', 
    padding: 5, borderRadius: 6, fontSize: 16, fontWeight: 'bold' 
  },
  x: { fontSize: 18, fontWeight: 'bold', color: '#ccc', marginRight: 10, marginTop: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  deleteBtn: { padding: 5 },
  fab: { 
    position: 'absolute', bottom: 20, right: 20, 
    backgroundColor: '#007AFF', width: 60, height: 60, 
    borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 
  }
});

export default RoutineDetailScreen;