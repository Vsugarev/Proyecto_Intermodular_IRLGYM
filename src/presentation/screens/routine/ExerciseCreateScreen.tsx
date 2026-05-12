import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { LibraryExercise, TrainingBranch } from '../../../domain/entities/LibraryExercise';
import { Theme } from '../../styles/theme';

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
      const exerciseData: LibraryExercise = {
        id: isEditing ? exerciseId : `custom_${Date.now()}`,
        name: name.trim(),
        category: category,
        branch: branch,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        muscleGroup: category,
        isCustom: true,
        isFavorite: false
      };
      await ExerciseService.saveCustomExercise(exerciseData);
      Alert.alert("Éxito", isEditing ? "Actualizado" : "Creado");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Press Banca con Mancuernas"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <Text style={styles.label}>Rama</Text>
        <View style={styles.chipRow}>
          {(['base', 'hypertrophy', 'powerlifting', 'calisthenics'] as TrainingBranch[]).map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.chip, branch === b && styles.activeChip]}
              onPress={() => setBranch(b)}
            >
              <Text style={[styles.chipText, branch === b && styles.activeChipText]}>
                {b.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Grupo Muscular</Text>
        <View style={styles.chipRow}>
          {['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.activeChip]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.activeChipText]}>{cat.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Técnica, agarre, etc..."
            placeholderTextColor={Theme.colors.textSecondary}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Imagen URL</Text>
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            placeholderTextColor={Theme.colors.textSecondary}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'ACTUALIZAR' : 'CREAR EJERCICIO'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { padding: Theme.spacing.md },
  inputGroup: { marginBottom: Theme.spacing.lg },
  label: { ...Theme.typography.caption, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  input: { 
    backgroundColor: Theme.colors.card, padding: 16, borderRadius: Theme.roundness.md, 
    fontSize: 16, color: Theme.colors.text, borderWidth: 1, borderColor: Theme.colors.border
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Theme.spacing.lg },
  chip: { 
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Theme.roundness.md, 
    backgroundColor: Theme.colors.card, borderWidth: 1, borderColor: Theme.colors.border
  },
  activeChip: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { color: Theme.colors.textSecondary, fontWeight: '800', fontSize: 11 },
  activeChipText: { color: '#fff' },
  saveBtn: { 
    backgroundColor: Theme.colors.success, padding: 18, borderRadius: Theme.roundness.lg, 
    alignItems: 'center', marginTop: Theme.spacing.lg, marginBottom: 40, ...Theme.shadows.medium
  },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 }
});