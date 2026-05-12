import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  ActivityIndicator, TouchableOpacity, Alert, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { LibraryExercise } from '../../../domain/entities/LibraryExercise';
import { WorkoutLog, Set } from '../../../domain/entities/Workout';
import { Theme } from '../../styles/theme';

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
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          <TouchableOpacity onPress={handleToggleFavorite} style={{ padding: 8 }}>
            <Ionicons 
              name={exercise?.isFavorite ? "star" : "star-outline"} 
              size={24} 
              color={Theme.colors.accent} 
            />
          </TouchableOpacity>
          {exercise?.isCustom && (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('ExerciseCreate', { exerciseId: exercise.id })} style={{ padding: 8 }}>
                <Ionicons name="create-outline" size={24} color={Theme.colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={24} color={Theme.colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )
    });
  }, [navigation, exercise]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [exerciseId])
  );

  const handleToggleFavorite = async () => {
    if (!exercise) return;
    await ExerciseService.toggleFavorite(exercise.id, exercise.isFavorite);
    loadData();
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Ejercicio",
      "¿Borrar este ejercicio personalizado?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", style: "destructive", 
          onPress: async () => {
            await ExerciseService.deleteExercise(exerciseId);
            navigation.goBack();
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

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Theme.colors.success} />
    </View>
  );
  if (!exercise) return <View style={styles.centered}><Text style={styles.errorText}>No encontrado</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {exercise.imageUrl ? (
            <Image source={{ uri: exercise.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Ionicons name="barbell" size={80} color={Theme.colors.cardLight} />
            </View>
          )}
          <View style={styles.titleOverlay}>
            <Text style={styles.title}>{exercise.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.muscleBadge}>
                <Text style={styles.muscleText}>{exercise.muscleGroup || 'General'}</Text>
              </View>
              <View style={[styles.muscleBadge, { backgroundColor: Theme.colors.cardLight }]}>
                <Text style={[styles.muscleText, { color: Theme.colors.textSecondary }]}>{exercise.category || 'Fuerza'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MAX PESO</Text>
              <Text style={styles.statValue}>{stats?.maxWeight?.toFixed(1) || '0.0'}<Text style={styles.unit}>kg</Text></Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>EST. 1RM</Text>
              <Text style={styles.statValue}>{stats?.estimated1RM?.toFixed(1) || '0.0'}<Text style={styles.unit}>kg</Text></Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>VOLUMEN</Text>
              <Text style={styles.statValue}>{stats?.maxVolume?.toFixed(0) || '0'}<Text style={styles.unit}>kg</Text></Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>SETS</Text>
              <Text style={styles.statValue}>{stats?.totalSeries || 0}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INSTRUCCIONES</Text>
            <Text style={styles.description}>
              {exercise.description || 'No hay instrucciones específicas para este ejercicio. Mantén una buena técnica.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HISTORIAL DE MARCAS</Text>
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
                    <View style={styles.seriesBadge}>
                      <Text style={styles.seriesBadgeText}>{log.series.length} SETS</Text>
                    </View>
                  </View>
                  <View style={styles.historyTable}>
                    {log.series.map((s: Set, i) => (
                      <View key={i} style={styles.historyRow}>
                        <Text style={styles.seriesLabel}>Set {i + 1}</Text>
                        <Text style={styles.seriesValue}>{s.kg}kg x {s.reps}</Text>
                        {s.rpe ? <Text style={styles.rpeText}>RPE {s.rpe}</Text> : null}
                      </View>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color={Theme.colors.cardLight} />
                <Text style={styles.emptyText}>Sin registros previos</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  errorText: { color: Theme.colors.textSecondary },
  header: { position: 'relative' },
  image: { width: '100%', height: 300 },
  placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.card },
  titleOverlay: { 
    padding: Theme.spacing.lg, 
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: Theme.roundness.xl,
    borderTopRightRadius: Theme.roundness.xl,
    marginTop: -30,
  },
  title: { ...Theme.typography.h1, fontSize: 30, marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 10 },
  muscleBadge: { 
    backgroundColor: 'rgba(40,167,69,0.1)', 
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Theme.roundness.md 
  },
  muscleText: { color: Theme.colors.success, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  content: { paddingHorizontal: Theme.spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Theme.spacing.xl },
  statCard: { 
    backgroundColor: Theme.colors.card, padding: 15, borderRadius: Theme.roundness.lg, 
    flex: 1, minWidth: '45%', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border
  },
  statLabel: { ...Theme.typography.caption, fontSize: 9, fontWeight: '900', marginBottom: 4 },
  statValue: { ...Theme.typography.h2, fontSize: 20 },
  unit: { fontSize: 12, color: Theme.colors.textSecondary, marginLeft: 2 },
  section: { marginBottom: Theme.spacing.xl },
  sectionTitle: { ...Theme.typography.caption, fontWeight: '900', letterSpacing: 1, marginBottom: Theme.spacing.md },
  description: { ...Theme.typography.body, fontSize: 14, color: Theme.colors.textTertiary, lineHeight: 22 },
  historyCard: { 
    backgroundColor: Theme.colors.card, padding: Theme.spacing.md, borderRadius: Theme.roundness.lg, 
    marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border 
  },
  historyHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 12, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, paddingBottom: 10 
  },
  historyDate: { ...Theme.typography.caption, fontWeight: '800' },
  historyRoutineName: { ...Theme.typography.h3, fontSize: 16 },
  seriesBadge: { backgroundColor: Theme.colors.cardLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  seriesBadgeText: { fontSize: 9, fontWeight: '900', color: Theme.colors.textSecondary },
  historyTable: { gap: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  seriesLabel: { ...Theme.typography.caption, width: 60 },
  seriesValue: { ...Theme.typography.body, fontSize: 14, fontWeight: '700', flex: 1 },
  rpeText: { fontSize: 11, color: Theme.colors.warning, fontWeight: '800' },
  emptyCard: { 
    padding: 40, backgroundColor: Theme.colors.card, borderRadius: Theme.roundness.lg, 
    alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.colors.border 
  },
  emptyText: { ...Theme.typography.caption, marginTop: 10 }
});
