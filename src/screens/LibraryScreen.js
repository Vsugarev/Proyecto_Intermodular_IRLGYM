import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { addExerciseToRoutine } from '../services/database';

const EXERCISES_DATA = [
  { id: '1', name: 'Press de Banca', muscle: 'Pecho' },
  { id: '2', name: 'Sentadillas', muscle: 'Piernas' },
  { id: '3', name: 'Peso Muerto', muscle: 'Espalda' },
  { id: '4', name: 'Press Militar', muscle: 'Hombros' },
  { id: '5', name: 'Curl de Bíceps', muscle: 'Brazos' },
];

const LibraryScreen = ({ route, navigation }) => {
  const routineId = route.params?.routineId;

  const handleAddExercise = (exerciseName) => {
    if (!routineId) {
      Alert.alert("Aviso", "Ve a 'Mis Rutinas', entra en una y dale a añadir ejercicios.");
      return;
    }
    const success = addExerciseToRoutine(routineId, exerciseName);
    if (success) {
      Alert.alert("¡Hecho!", `${exerciseName} añadido.`, [
        { text: "Ok", onPress: () => navigation.goBack() }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biblioteca</Text>
      <FlatList
        data={EXERCISES_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleAddExercise(item.name)}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.muscle}>{item.muscle}</Text>
            </View>
            <Text style={styles.addText}>+ Añadir</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 18 },
  muscle: { color: '#888' },
  addText: { color: '#007AFF', fontWeight: 'bold' }
});

export default LibraryScreen;