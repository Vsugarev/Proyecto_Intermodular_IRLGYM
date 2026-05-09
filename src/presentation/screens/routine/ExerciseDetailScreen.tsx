import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { LibraryExercise } from '../../../domain/entities/LibraryExercise';
import { WorkoutLog, Set } from '../../../domain/entities/Workout';

interface HistoryLog extends WorkoutLog {
  workoutName?: string;
  workoutDate?: string;
  isTemplate?: boolean;
  status?: string;
}

export const ExerciseDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { exerciseId } = route.params || {};
  const [exercise, setExercise] = useState<LibraryExercise | null>(null);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (exercise?.isCustom) {
      navigation.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row', marginRight: 10 }}>
            <TouchableOpacity onPress={() => navigation.navigate('ExerciseCreate', { exerciseId: exercise.id })} style={{ padding: 8 }}>
              <Ionicons name="create-outline" size={24} color="#28a745" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={{ padding: 8 }}>
              <Ionicons name="trash-outline" size={24} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        )
      });
    } else {
      navigation.setOptions({ headerRight: () => null });
    }
  }, [exercise]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [exerciseId])
  );

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Ejercicio",
      "¿Estás seguro de que quieres eliminar este ejercicio personalizado? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await ExerciseService.deleteExercise(exerciseId);
              navigation.goBack();
            } catch (e: any) {
              console.error(e);
              Alert.alert("Error", "No se pudo eliminar el ejercicio. Comprueba si está siendo usado en alguna rutina activa.");
            }
          } 
        }
      ]
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await ExerciseService.getExerciseWithStats(exerciseId);
      if (data) {
        setExercise(data.exercise);
        setHistory(data.history);
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#28a745" />;
  if (!exercise) return <Text>Ejercicio no encontrado</Text>;

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
          <Text style={styles.statValue}>{stats?.maxWeight?.toFixed(1) || '0.0'} <Text style={styles.unit}>kg</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Est. 1RM</Text>
          <Text style={styles.statValue}>{stats?.estimated1RM?.toFixed(1) || '0.0'} <Text style={styles.unit}>kg</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max Volumen</Text>
          <Text style={styles.statValue}>{stats?.maxVolume?.toFixed(0) || '0'} <Text style={styles.unit}>kg</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Series</Text>
          <Text style={styles.statValue}>{stats?.totalSeries || 0}</Text>
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
