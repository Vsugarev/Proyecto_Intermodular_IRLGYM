import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { getRoutines, addExerciseToRoutine } from '../services/database';
import { auth } from '../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { Colors, Spacing, BorderRadius } from '../styles/theme';
import ExerciseCard from '../components/ExerciseCard';

const EXERCISES_DATA = [
  { id: '1', name: 'Press de Banca', muscle: 'Pecho' },
  { id: '2', name: 'Sentadillas', muscle: 'Piernas' },
  { id: '3', name: 'Peso Muerto', muscle: 'Espalda' },
  { id: '4', name: 'Press Militar', muscle: 'Hombros' },
  { id: '5', name: 'Curl de Bíceps', muscle: 'Brazos' },
];

const LibraryScreen = ({ route, navigation }) => {
  const [routines, setRoutines] = useState([]);
  const [selectedEx, setSelectedEx] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadRoutines = () => {
    if (auth.currentUser) {
      setRoutines(getRoutines(auth.currentUser.uid));
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadRoutines();
    });

    // LIMPIEZA AL SALIR: Cuando el usuario sale de la pantalla, 
    // reseteamos los parámetros para que la próxima vez entre "limpio"
    const blurUnsubscribe = navigation.addListener('blur', () => {
      navigation.setParams({ routineId: null });
      setShowModal(false);
    });

    loadRoutines();
    return () => {
      unsubscribe();
      blurUnsubscribe();
    };
  }, [navigation]);

  const handleAddPress = (exercise) => {
    // Verificamos si existe un routineId REAL en los parámetros actuales
    const targetRoutineId = route.params?.routineId;

    if (targetRoutineId) {
      // Si venimos de una rutina específica, añadimos y volvemos
      addExerciseToRoutine(targetRoutineId, exercise.name);
      alert(`${exercise.name} añadido.`);
      navigation.goBack();
    } else {
      // Si el ID es nulo (porque entramos desde el Tab Bar), abrimos modal
      if (routines.length === 0) {
        alert("Crea una rutina primero.");
        return;
      }
      setSelectedEx(exercise);
      setShowModal(true);
    }
  };

  const confirmSelection = (routineId) => {
    addExerciseToRoutine(routineId, selectedEx.name);
    setShowModal(false);
    setSelectedEx(null);
    alert(`Añadido correctamente.`);
  };

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={EXERCISES_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseCard 
            name={item.name} 
            subtitle={item.muscle} 
            onAction={() => handleAddPress(item)} 
          />
        )}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={localStyles.modalBg}>
          <View style={localStyles.modalContent}>
            <Text style={[globalStyles.subtitle, { textAlign: 'center', marginBottom: 20 }]}>
               ¿A qué rutina añadimos {selectedEx?.name}?
            </Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {routines.map((r) => (
                <TouchableOpacity key={r.id.toString()} style={localStyles.option} onPress={() => confirmSelection(r.id)}>
                  <Ionicons name="barbell-outline" size={20} color={Colors.primary} style={{marginRight: 10}} />
                  <Text style={{ fontSize: 16, color: Colors.text }}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ color: Colors.danger, fontWeight: 'bold' }}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: Colors.white, borderRadius: BorderRadius.large, padding: Spacing.l, elevation: 10 },
  option: { flexDirection: 'row', padding: Spacing.m, borderBottomWidth: 1, borderBottomColor: Colors.lightGray, alignItems: 'center' }
});

export default LibraryScreen;