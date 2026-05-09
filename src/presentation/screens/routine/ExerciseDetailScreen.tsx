import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { LogRepository } from '../../../data/repositories/index';
import { LibraryExercise } from '../../../domain/entities/LibraryExercise';
import { WorkoutLog, Set } from '../../../domain/entities/Workout';

interface HistoryLog extends WorkoutLog {
  workoutName?: string;
  workoutDate?: string;
}

export const ExerciseDetailScreen = ({ route, navigation }: any) => {
  const { exerciseId } = route.params || {};
  const [exercise, setExercise] = useState<LibraryExercise | null>(null);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [exerciseId]);

  const loadData = async () => {
    try {
      const exData = await ExerciseService.getExerciseById(exerciseId);
      const logs = await LogRepository.findByExerciseId(exerciseId);
      
      const logsWithWorkoutInfo = await Promise.all(logs.map(async (log: WorkoutLog) => {
        const workout = await WorkoutService.getWorkoutById(log.workoutId);
        return {
          ...log,
          workoutName: workout?.name || 'Entrenamiento',
          workoutDate: workout?.date,
          isTemplate: workout?.isTemplate,
          status: workout?.status
        };
      }));

      // Filtramos: Solo sesiones finalizadas, NO plantillas (Hevy style)
      const filteredHistory = logsWithWorkoutInfo.filter(l => !l.isTemplate && l.status === 'completed');

      setExercise(exData);
      setHistory(filteredHistory.sort((a, b) => {
        const dateA = a.workoutDate ? new Date(a.workoutDate).getTime() : 0;
        const dateB = b.workoutDate ? new Date(b.workoutDate).getTime() : 0;
        return dateB - dateA;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#28a745" />;
  if (!exercise) return <Text>Ejercicio no encontrado</Text>;

  const maxWeight = history.reduce((max, log: WorkoutLog) => {
    const logMax = log.series.length > 0 ? Math.max(...log.series.map((s: Set) => s.kg || 0)) : 0;
    return Math.max(max, logMax);
  }, 0);

  const estimated1RM = history.reduce((max, log: WorkoutLog) => {
    const logMax1RM = log.series.length > 0 ? Math.max(...log.series.map((s: Set) => {
      if (s.reps > 1) return s.kg * (1 + 0.0333 * s.reps);
      return s.kg;
    })) : 0;
    return Math.max(max, logMax1RM);
  }, 0);

  const maxVolume = history.reduce((max, log: WorkoutLog) => {
    const logVolume = log.series.reduce((sum, s: Set) => sum + (s.kg * s.reps), 0);
    return Math.max(max, logVolume);
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
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="book-outline" size={20} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Instrucciones de Ejecución</Text>
        </View>
        <Text style={styles.description}>
          {exercise.description || 'No se han proporcionado instrucciones específicas para la ejecución de este ejercicio. Asegúrate de mantener una técnica correcta y consultar con un profesional si tienes dudas.'}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max Peso</Text>
          <Text style={styles.statValue}>{maxWeight.toFixed(1)} <Text style={styles.unit}>kg</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Est. 1RM</Text>
          <Text style={styles.statValue}>{estimated1RM.toFixed(1)} <Text style={styles.unit}>kg</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max Volumen</Text>
          <Text style={styles.statValue}>{maxVolume.toFixed(0)} <Text style={styles.unit}>kg</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Series</Text>
          <Text style={styles.statValue}>{history.reduce((acc, log) => acc + log.series.length, 0)}</Text>
        </View>
      </View>

      <View style={[styles.section, { marginBottom: 30 }]}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="time-outline" size={20} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Historial de Marcas</Text>
        </View>
        {history.length > 0 ? (
          history.map((log) => (
            <View key={log.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyDate}>
                    {log.workoutDate ? new Date(log.workoutDate).toLocaleDateString() : 'Sin fecha'}
                  </Text>
                  <Text style={styles.historyRoutineName}>{log.workoutName}</Text>
                </View>
                <Text style={styles.historySubtitle}>{log.series.length} series</Text>
              </View>
              <View style={styles.historyTable}>
                {log.series.map((s: Set, i) => (
                  <View key={i} style={styles.historyRow}>
                    <Text style={styles.seriesLabel}>Serie {i + 1}</Text>
                    <Text style={styles.seriesValue}>{s.kg} kg x {s.reps}</Text>
                    {s.rpe ? (
                      <View style={styles.rpeBadge}>
                        <Text style={styles.rpeText}>RPE {s.rpe}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={40} color="#c7c7cc" />
            <Text style={styles.emptyText}>No hay entrenamientos registrados aún.</Text>
          </View>
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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  description: { fontSize: 15, color: '#48484a', lineHeight: 22 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'space-between', marginTop: 12 },
  statCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, width: '48%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 12 },
  statLabel: { fontSize: 11, color: '#8e8e93', marginBottom: 4, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#000' },
  unit: { fontSize: 12, fontWeight: '600', color: '#8e8e93' },
  historyCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f7', paddingBottom: 8 },
  historyDate: { fontSize: 13, fontWeight: '700', color: '#8e8e93', marginBottom: 2 },
  historyRoutineName: { fontSize: 15, fontWeight: '700', color: '#1c1c1e' },
  historySubtitle: { fontSize: 11, color: '#8e8e93', fontWeight: '600' },
  historyTable: { marginTop: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  seriesLabel: { fontSize: 13, color: '#8e8e93', width: 60, fontWeight: '600' },
  seriesValue: { fontSize: 14, color: '#1c1c1e', fontWeight: '700', flex: 1 },
  rpeBadge: { backgroundColor: '#f2f2f7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rpeText: { fontSize: 10, color: '#48484a', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { textAlign: 'center', color: '#8e8e93', marginTop: 12, fontSize: 14, fontWeight: '500' }
});
