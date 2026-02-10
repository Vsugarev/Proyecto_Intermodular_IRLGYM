import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
// Cambiamos addXP por updateProgress
import { getExercisesByRoutine, updateExerciseStats, deleteExerciseFromRoutine, updateProgress } from '../services/database';
import { auth } from '../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { Colors, BorderRadius } from '../styles/theme';
import StatInput from '../components/StatInput';
import CustomButton from '../components/CustomButton';

const RoutineDetailScreen = ({ route, navigation }) => {
  const { routine } = route.params;
  const [exercises, setExercises] = useState([]);

  const loadExercises = () => setExercises(getExercisesByRoutine(routine.id));

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadExercises);
    loadExercises();
    return unsubscribe;
  }, [navigation]);

  const confirmDelete = (id, name) => {
    if (Platform.OS === 'web') {
      const proceed = confirm(`¿Estás seguro de que quieres eliminar "${name}"?`);
      if (proceed) handleDelete(id);
    } else {
      Alert.alert(
        "Eliminar Ejercicio",
        `¿Quieres quitar "${name}" de esta rutina?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: () => handleDelete(id) }
        ]
      );
    }
  };

  const handleDelete = (id) => {
    deleteExerciseFromRoutine(id);
    loadExercises();
  };

  const handleFinishWorkout = () => {
    if (exercises.length === 0) return alert("Añade ejercicios antes de finalizar.");
    
    const points = exercises.length * 10;
    
    // Usamos la nueva función que actualiza XP y Racha
    const newStats = updateProgress(auth.currentUser.uid, points);
    
    alert(`¡Entrenamiento guardado!\nGanaste ${points} XP.\nTu racha actual: ${newStats.streak} días.`);
    navigation.goBack();
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>{routine.name}</Text>
      
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <View style={{ flex: 1 }}>
              <Text style={globalStyles.subtitle}>{item.exercise_name}</Text>
              <View style={[globalStyles.row, { marginTop: 10 }]}>
                <StatInput 
                  label="S" 
                  val={item.series} 
                  onChange={(t) => updateExerciseStats(item.id, t, item.reps, item.weight)} 
                />
                <StatInput 
                  label="Kg" 
                  val={item.weight} 
                  onChange={(t) => updateExerciseStats(item.id, item.series, item.reps, t)} 
                  isWeight 
                />
                <StatInput 
                  label="R" 
                  val={item.reps} 
                  onChange={(t) => updateExerciseStats(item.id, item.series, t, item.weight)} 
                />
              </View>
            </View>
            
            <TouchableOpacity onPress={() => confirmDelete(item.id, item.exercise_name)} style={{ padding: 5 }}>
              <Ionicons name="close-circle" size={28} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={exercises.length > 0 && (
          <View style={{ paddingHorizontal: 10 }}>
            <CustomButton 
              title="FINALIZAR RUTINA" 
              type="success" 
              onPress={handleFinishWorkout} 
              style={{ marginTop: 20 }} 
            />
          </View>
        )}
      />
      
      {/* Botón Flotante (FAB) */}
      <TouchableOpacity 
        style={localStyles.fab} 
        onPress={() => navigation.navigate('MainApp', { screen: 'Biblioteca', params: { routineId: routine.id } })}
      >
        <Ionicons name="add" size={35} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 30, 
    backgroundColor: Colors.primary, 
    width: 65, 
    height: 65, 
    borderRadius: BorderRadius.round, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});

export default RoutineDetailScreen;