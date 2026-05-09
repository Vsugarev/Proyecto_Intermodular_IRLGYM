import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { LogRepository } from '../../../data/repositories/index';
import { LibraryExercise } from '../../../domain/entities/LibraryExercise';
import { WorkoutLog, Set } from '../../../domain/entities/Workout';

export const ExerciseDetailScreen = ({ route, navigation }: any) => {
  const { exerciseId } = route.params || {};
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
      setHistory(histData.sort((a: WorkoutLog, b: WorkoutLog) => {
        const timeA = parseInt(a.id.replace('log_', '')) || 0;
        const timeB = parseInt(b.id.replace('log_', '')) || 0;
        return timeB - timeA;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#28a745" />;
  if (!exercise) return <Text>Ejercicio no encontrado</Text>;

  const bestWeight = history.reduce((max, log: WorkoutLog) => {
    const logMax = log.series.length > 0 ? Math.max(...log.series.map((s: Set) => s.kg || 0)) : 0;
    return Math.max(max, logMax);
  }, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {exercise.imageUrl ? (
          <Image source={{ uri: exercise.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="barbell-outline" size={80} color="#8e8e93" />
            <Text style={styles.placeholderText}>Sin imagen disponible</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{exercise.name}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.muscleBadge}>
              <Text style={styles.muscleText}>{exercise.muscleGroup || 'General'}</Text>
            </View>
            <View style={[styles.muscleBadge, { backgroundColor: '#e5e5ea' }]}>
              <Text style={[styles.muscleText, { color: '#8e8e93' }]}>{exercise.category || 'Fuerza'}</Text>
            </View>
          </View>
        </View>
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
              {log.series.map((s: Set, i) => (
                <Text key={i} style={styles.seriesText}>
                  Serie {i + 1}: {s.reps} reps x {s.kg} kg
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
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  image: { width: '100%', height: 300 },
  placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e5ea' },
  placeholderText: { color: '#8e8e93', marginTop: 10, fontSize: 12, fontWeight: '600' },
  headerInfo: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#000', letterSpacing: -0.5 },
  badgeContainer: { flexDirection: 'row', marginTop: 12 },
  muscleBadge: { 
    backgroundColor: '#e8f5e9', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    marginRight: 8
  },
  muscleText: { color: '#28a745', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  section: { padding: 20, backgroundColor: '#fff', marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#000' },
  description: { fontSize: 15, color: '#48484a', lineHeight: 22 },
  statsRow: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
  statCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, width: '48%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statLabel: { fontSize: 11, color: '#8e8e93', marginBottom: 4, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#000' },
  historyCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  historyDate: { fontSize: 14, fontWeight: '700', color: '#8e8e93', marginBottom: 10 },
  seriesText: { fontSize: 15, color: '#1c1c1e', marginBottom: 4, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#8e8e93', marginTop: 20, fontSize: 14 }
});
