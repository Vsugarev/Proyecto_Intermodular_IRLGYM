import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { 
  getExercisesByRoutine, 
  updateExerciseStats, 
  deleteExerciseFromRoutine, 
  updateProgress 
} from '../services/database';
import { auth } from '../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { Colors, BorderRadius, Spacing } from '../styles/theme';
import StatInput from '../components/StatInput';
import CustomButton from '../components/CustomButton';
import ProgressChart from '../components/ProgressChart'; // Asegúrate de crear este componente

const RoutineDetailScreen = ({ route, navigation }) => {
  const { routine } = route.params;
  const [exercises, setExercises] = useState([]);
  const [expandedId, setExpandedId] = useState(null); // Para mostrar/ocultar gráfica

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
    const newStats = updateProgress(auth.currentUser.uid, points, exercises); // Pasamos ejercicios para el historial
    
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
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          
          return (
            <View style={[globalStyles.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <TouchableOpacity 
                style={[globalStyles.row, { justifyContent: 'space-between' }]}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <View>
                  <Text style={globalStyles.subtitle}>{item.exercise_name}</Text>
                  <Text style={globalStyles.caption}>
                    {isExpanded ? "Ocultar progreso" : "Ver progreso 📈"}
                  </Text>
                </View>
                <View style={globalStyles.row}>
                  <TouchableOpacity onPress={() => confirmDelete(item.id, item.exercise_name)} style={{ padding: 5 }}>
                    <Ionicons name="close-circle" size={24} color={Colors.danger} />
                  </TouchableOpacity>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={Colors.gray} 
                    style={{ marginLeft: 10 }}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={localStyles.expandedContent}>
                  {/* Pasamos datos reales o simulación si no hay historial aún */}
                  <ProgressChart exerciseName={item.exercise_name} />
                  
                  <View style={[globalStyles.row, { justifyContent: 'space-around', marginTop: 15 }]}>
                    <StatInput 
                      label="S" 
                      val={item.series} 
                      onChange={(t) => {
                        updateExerciseStats(item.id, t, item.reps, item.weight);
                        loadExercises();
                      }} 
                    />
                    <StatInput 
                      label="Kg" 
                      val={item.weight} 
                      onChange={(t) => {
                        updateExerciseStats(item.id, item.series, item.reps, t);
                        loadExercises();
                      }} 
                      isWeight 
                    />
                    <StatInput 
                      label="R" 
                      val={item.reps} 
                      onChange={(t) => {
                        updateExerciseStats(item.id, item.series, t, item.weight);
                        loadExercises();
                      }} 
                    />
                  </View>
                </View>
              )}
            </View>
          );
        }}
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
  expandedContent: {
    marginTop: Spacing.m,
    paddingTop: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
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