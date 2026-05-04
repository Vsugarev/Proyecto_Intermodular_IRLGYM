import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ExerciseRepository } from '../../../data/repositories/index';
import { LibraryExercise, TrainingBranch } from '../../../domain/entities/LibraryExercise';

export const ExerciseCreateScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pecho');
  const [branch, setBranch] = useState<TrainingBranch>('base');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    try {
      const newExercise: LibraryExercise = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        category: category,
        branch: branch,
        isCustom: true,
        isFavorite: false
      };

      await ExerciseRepository.save(newExercise); 
      
      Alert.alert("Éxito", "Ejercicio creado correctamente");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el ejercicio");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre del Ejercicio</Text>
      <TextInput 
        style={styles.input} 
        value={name} 
        onChangeText={setName} 
        placeholder="Ej: Press Banca con Mancuernas"
      />

      <Text style={styles.label}>Rama de Entrenamiento</Text>
      <View style={styles.categoryContainer}>
        {(['base', 'hypertrophy', 'powerlifting', 'calisthenics'] as TrainingBranch[]).map((b) => (
          <TouchableOpacity 
            key={b} 
            style={[styles.chip, branch === b && styles.activeChip]}
            onPress={() => setBranch(b)}
          >
            <Text style={branch === b ? styles.activeText : styles.text}>
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Categoría (Grupo Muscular)</Text>
      <View style={styles.categoryContainer}>
        {['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo'].map((cat) => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.chip, category === cat && styles.activeChip]}
            onPress={() => setCategory(cat)}
          >
            <Text style={category === cat ? styles.activeText : styles.text}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.btnText}>GUARDAR EJERCICIO</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  chip: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 20 },
  activeChip: { backgroundColor: '#28a745', borderColor: '#28a745' },
  activeText: { color: '#fff', fontWeight: 'bold' },
  text: { color: '#333' },
  saveBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 40 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});