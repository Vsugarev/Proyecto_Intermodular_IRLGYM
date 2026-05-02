import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { WorkoutService } from '../../../application/service/WorkoutService';

export const RoutineEditScreen = ({ route, navigation }: any) => {
  const { routine } = route.params; 
  const [name, setName] = useState(routine.name);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const data = await WorkoutService.getWorkoutLogs(routine.id);
    setExercises(data);
    setLoading(false);
  };

  const handleUpdate = async () => {
    try {
      await WorkoutService.updateWorkoutName(routine.id, name);
      Alert.alert("Éxito", "Nombre de rutina actualizado");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", "No se pudo guardar: " + e.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar",
      "¿Borrar esta rutina definitivamente?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Borrar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await WorkoutService.deleteWorkout(routine.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert("Error", "No se pudo eliminar");
            }
          } 
        }
      ]
    );
  };

  const handleAddExercise = async () => {
    const mockExerciseId = "ex_" + Date.now();
    const mockSeries = [{ reps: 10, weight: 20 }];
    
    try {
      await WorkoutService.addExerciseLog(routine.id, mockExerciseId, mockSeries);
      loadExercises();
    } catch (e) {
      Alert.alert("Error", "No se pudo añadir el ejercicio");
    }
  };

  const removeExercise = async (logId: string) => {
    try {
      await WorkoutService.deleteExerciseLog(logId);
      loadExercises();
    } catch (e) {
      Alert.alert("Error", "No se pudo quitar el ejercicio");
    }
  };

  const renderExerciseItem = ({ item }: any) => (
    <View style={styles.exerciseItem}>
      {/* Rutine-Edit-01: Visualización de ejercicios y series */}
      <View style={{ flex: 1 }}>
        <Text style={styles.exerciseName}>Ejercicio: {item.exerciseId}</Text>
        <Text style={styles.exerciseSub}>Series: {item.series?.length || 0}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Editar Nombre</Text>
      <TextInput 
        style={styles.input} 
        value={name} 
        onChangeText={setName}
        placeholder="Ej: Empuje pesado"
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.label}>Ejercicios de la Rutina</Text>
        <TouchableOpacity onPress={handleAddExercise}>
          <Text style={styles.addText}>+ AÑADIR</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay ejercicios en esta rutina.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
        <Text style={styles.btnText}>CONFIRMAR CAMBIOS</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>ELIMINAR RUTINA</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: '#fff' },
  label: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  input: { borderWidth: 1, borderColor: '#eee', padding: 15, borderRadius: 12, marginBottom: 25, fontSize: 16, backgroundColor: '#fafafa' },
  saveBtn: { backgroundColor: '#28a745', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  deleteBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#dc3545' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  deleteBtnText: { color: '#dc3545', fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  addText: { color: '#28a745', fontWeight: 'bold' },
  exerciseItem: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontWeight: 'bold', fontSize: 16 },
  exerciseSub: { color: '#666', fontSize: 12 },
  removeBtn: { marginLeft: 15, padding: 10 },
  removeText: { color: '#dc3545', fontWeight: 'bold', fontSize: 18 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 20 }
});