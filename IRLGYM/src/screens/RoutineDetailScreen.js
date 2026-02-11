import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { 
  getExercisesByRoutine, 
  updateExerciseStats, 
  deleteExerciseFromRoutine, 
  updateProgress 
} from '../services/database';
import { auth } from '../services/firebaseConfig';
import { useStats } from '../context/StatsContext'; // <-- NUEVO
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { Colors, BorderRadius, Spacing } from '../styles/theme';
import StatInput from '../components/StatInput';
import CustomButton from '../components/CustomButton';
import ProgressChart from '../components/ProgressChart';

const RoutineDetailScreen = ({ route, navigation }) => {
  const { routine } = route.params;
  const [exercises, setExercises] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const { reloadStats } = useStats(); // <-- CONSUMIMOS EL CONTEXTO

  const loadExercises = () => setExercises(getExercisesByRoutine(routine.id));

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadExercises);
    loadExercises();
    return unsubscribe;
  }, [navigation]);

  const confirmDelete = (id, name) => {
    if (Platform.OS === 'web') {
      if (confirm(`¿Estás seguro de que quieres eliminar "${name}"?`)) handleDelete(id);
    } else {
      Alert.alert("Eliminar", `¿Quitar "${name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => handleDelete(id) }
      ]);
    }
  };

  const handleDelete = (id) => {
    deleteExerciseFromRoutine(id);
    loadExercises();
  };

  const handleFinishWorkout = () => {
    if (exercises.length === 0) {
      return Platform.OS === 'web' ? alert("Añade ejercicios") : Alert.alert("Error", "Añade ejercicios");
    }
    
    const points = exercises.length * 10;
    const res = updateProgress(auth.currentUser.uid, points, exercises);
    
    // ESTO ES CLAVE: Avisamos a toda la app que el XP cambió
    reloadStats(); 

    const msg = `¡Entrenamiento guardado!\n+${points} XP\nRacha: ${res.streak} días.`;
    
    if (Platform.OS === 'web') {
      alert(msg);
      navigation.goBack();
    } else {
      Alert.alert("¡Buen trabajo!", msg, [{ text: "OK", onPress: () => navigation.goBack() }]);
    }
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
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <View>
                  <Text style={globalStyles.subtitle}>{item.exercise_name}</Text>
                  <Text style={globalStyles.caption}>{isExpanded ? "Ocultar" : "Ver progreso 📈"}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => confirmDelete(item.id, item.exercise_name)} style={{ padding: 10 }}>
                    <Ionicons name="close-circle" size={24} color={Colors.danger} />
                  </TouchableOpacity>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={Colors.gray} />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={localStyles.expandedContent}>
                  <ProgressChart exerciseName={item.exercise_name} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 }}>
                    <StatInput label="S" val={item.series} onChange={(t) => { updateExerciseStats(item.id, t, item.reps, item.weight); loadExercises(); }} />
                    <StatInput label="Kg" val={item.weight} isWeight onChange={(t) => { updateExerciseStats(item.id, item.series, item.reps, t); loadExercises(); }} />
                    <StatInput label="R" val={item.reps} onChange={(t) => { updateExerciseStats(item.id, item.series, t, item.weight); loadExercises(); }} />
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={exercises.length > 0 && (
          <CustomButton title="FINALIZAR RUTINA" type="success" onPress={handleFinishWorkout} style={{ marginTop: 20 }} />
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
  expandedContent: { marginTop: Spacing.m, paddingTop: Spacing.m, borderTopWidth: 1, borderTopColor: Colors.lightGray },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: Colors.primary, width: 65, height: 65, borderRadius: 33, justifyContent: 'center', alignItems: 'center', elevation: 5 }
});

export default RoutineDetailScreen;