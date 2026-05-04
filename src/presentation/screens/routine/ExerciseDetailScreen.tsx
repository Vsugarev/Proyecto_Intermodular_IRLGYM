import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { LogRepository } from '../../../data/repositories/index';
import { LibraryExercise } from '../../../domain/entities/LibraryExercise';
import { WorkoutLog } from '../../../domain/entities/Workout';

export const ExerciseDetailScreen = ({ route, navigation }: any) => {
  const { exerciseId } = route.params;
  const [exercise, setExercise] = useState<LibraryExercise | null>(null);
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [exerciseId]);

  const loadData = async () => {
    try {
      const exData = await ExerciseService.getExerciseById(exerciseId);
      const histData = await LogRepository.findByExerciseId(exerciseId);
      setExercise(exData);
      setHistory(histData.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime())); // Asumiendo ID tiene tiempo o hay fecha
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#28a745" />;
  if (!exercise) return <Text>Ejercicio no encontrado</Text>;

  const bestWeight = history.reduce((max, log) => {
    const logMax = Math.max(...log.series.map(s => s.weight || 0));
    return Math.max(max, logMax);
  }, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {exercise.imageUrl ? (
          <Image source={{ uri: exercise.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="barbell" size={80} color="#ccc" />
          </View>
        )}
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.muscleGroup}>{exercise.muscleGroup || 'Grupo muscular no especificado'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción Técnica</Text>
        <Text style={styles.description}>
          {exercise.description || 'No hay descripción disponible para este ejercicio.'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Mejor Peso</Text>
          <Text style={styles.statValue}>{bestWeight} kg</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Series</Text>
          <Text style={styles.statValue}>{history.length}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial Reciente</Text>
        {history.length > 0 ? (
          history.map((log, index) => (
            <View key={log.id} style={styles.historyCard}>
              <Text style={styles.historyDate}>Registro #{history.length - index}</Text>
              {log.series.map((s, i) => (
                <Text key={i} style={styles.seriesText}>
                  Serie {i + 1}: {s.reps} reps x {s.weight} kg
                </Text>
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aún no has registrado marcas para este ejercicio.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  image: { width: '100%', height: 250, borderRadius: 15, marginBottom: 15 },
  placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1a1a1a' },
  muscleGroup: { fontSize: 16, color: '#28a745', fontWeight: '600', marginTop: 5 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  description: { fontSize: 15, color: '#666', lineHeight: 22 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 15, justifyContent: 'space-between' },
  statCard: { backgroundColor: '#f0fdf4', padding: 15, borderRadius: 12, width: '48%', alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#166534', marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  historyCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  historyDate: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8 },
  seriesText: { fontSize: 14, color: '#333', marginBottom: 2 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20, fontStyle: 'italic' }
});
