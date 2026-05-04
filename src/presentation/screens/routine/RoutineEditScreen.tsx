import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { LogService } from '../../../application/service/LogService';

export const RoutineEditScreen = ({ route, navigation }: any) => {
  const { routine } = route.params || {}; 
  const [name, setName] = useState(routine?.name || '');
  const [exercises, setExercises] = useState<any[]>([]);

  useEffect(() => {
    if (routine?.id) loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await LogService.getLogsByWorkout(routine.id);
      setExercises(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async () => {
    try {
      await WorkoutService.updateWorkout({ ...routine, name });
      Alert.alert("Éxito", "Cambios guardados");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", "No se pudo guardar");
    }
  };

  const handleDelete = () => {
    Alert.alert("Eliminar", "¿Borrar esta rutina?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: async () => {
          await WorkoutService.deleteWorkout(routine.id);
          navigation.goBack();
      }}
    ]);
  };

  const openExerciseLibrary = () => {
    navigation.navigate('ExerciseLibrary', {
      isSelecting: true,
      onSelect: (selectedExercise: any) => {
        const newLog = {
          id: `log_${Date.now()}`,
          exerciseId: selectedExercise.id,
          exerciseName: selectedExercise.name,
          workoutId: routine.id,
          series: []
        };
        setExercises(prev => [...prev, newLog]);
      }
    });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...exercises];
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= newExercises.length) return;
    [newExercises[index], newExercises[nextIndex]] = [newExercises[nextIndex], newExercises[index]];
    setExercises(newExercises);
  };

  const renderExerciseItem = ({ item, index }: any) => (
    <View style={styles.exerciseItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.exerciseName}>{item.exerciseName || "Ejercicio"}</Text>
        <Text style={styles.exerciseSub}>{item.series?.length || 0} series</Text>
      </View>
      <View style={styles.orderButtons}>
        <TouchableOpacity onPress={() => moveItem(index, 'up')}><Text style={styles.orderText}>▲</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => moveItem(index, 'down')}><Text style={styles.orderText}>▼</Text></TouchableOpacity>
      </View>
      <TouchableOpacity 
        onPress={() => navigation.navigate('EditSeries', { log: item })}
        style={styles.editSetsBtn}
      >
        <Text style={styles.editSetsText}>Series</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre de la Rutina</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <View style={styles.sectionHeader}>
        <Text style={styles.label}>Ejercicios</Text>
        <TouchableOpacity onPress={openExerciseLibrary}>
          <Text style={styles.addText}>+ AÑADIR</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
      />
      <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
        <Text style={styles.btnText}>GUARDAR CAMBIOS</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>ELIMINAR RUTINA</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  addText: { color: '#28a745', fontWeight: 'bold' },
  exerciseItem: { padding: 15, backgroundColor: '#f8f9fa', borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  exerciseName: { fontWeight: 'bold', fontSize: 15 },
  exerciseSub: { color: '#888', fontSize: 12 },
  orderButtons: { marginHorizontal: 10 },
  orderText: { fontSize: 18, color: '#ccc' },
  editSetsBtn: { backgroundColor: '#e9ecef', padding: 10, borderRadius: 5 },
  editSetsText: { fontSize: 12, color: '#495057', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center' },
  deleteBtn: { marginTop: 15, alignItems: 'center' },
  deleteBtnText: { color: '#dc3545' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});