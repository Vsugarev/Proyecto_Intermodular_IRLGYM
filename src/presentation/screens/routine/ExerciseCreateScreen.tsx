import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { LibraryExercise, TrainingBranch } from '../../../domain/entities/LibraryExercise';

export const ExerciseCreateScreen = ({ route, navigation }: any) => {
  const { exerciseId } = route.params || {};
  const isEditing = !!exerciseId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pecho');
  const [branch, setBranch] = useState<TrainingBranch>('base');

  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  React.useEffect(() => {
    if (isEditing) {
      loadExercise();
    }
  }, [exerciseId]);

  const loadExercise = async () => {
    const ex = await ExerciseService.getExerciseById(exerciseId);
    if (ex) {
      setName(ex.name);
      setCategory(ex.category);
      setBranch(ex.branch);
      setDescription(ex.description || '');
      setImageUrl(ex.imageUrl || '');
      navigation.setOptions({ title: 'Editar Ejercicio' });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    try {
      if (isEditing) {
        const updatedExercise: LibraryExercise = {
          id: exerciseId,
          name: name.trim(),
          category: category,
          branch: branch,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          muscleGroup: category,
          isCustom: true,
          isFavorite: false
        };
        await ExerciseService.saveCustomExercise(updatedExercise);
        Alert.alert("Éxito", "Ejercicio actualizado correctamente");
      } else {
        const newExercise: LibraryExercise = {
          id: `custom_${Date.now()}`,
          name: name.trim(),
          category: category,
          branch: branch,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          muscleGroup: category,
          isCustom: true,
          isFavorite: false
        };
        await ExerciseService.saveCustomExercise(newExercise);
        Alert.alert("Éxito", "Ejercicio creado correctamente");
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el ejercicio");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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

        <Text style={styles.label}>Descripción Técnica</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Ej: Mantener la espalda recta..."
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>URL de Imagen/GIF (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.btnText}>GUARDAR EJERCICIO</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f7' },
  label: { fontSize: 13, fontWeight: '700', color: '#8e8e93', marginBottom: 8, marginTop: 20, textTransform: 'uppercase' },
  input: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 14, 
    fontSize: 16, 
    color: '#1c1c1e',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea'
  },
  activeChip: { backgroundColor: '#28a745', borderColor: '#28a745' },
  activeText: { color: '#fff', fontWeight: 'bold' },
  text: { color: '#1c1c1e', fontWeight: '600', fontSize: 13 },
  saveBtn: { 
    backgroundColor: '#28a745', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 40, 
    marginBottom: 30,
    shadowColor: '#28a745', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});