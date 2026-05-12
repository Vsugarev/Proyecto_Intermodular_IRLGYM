import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { Workout, WorkoutLog } from '../../../domain/entities/Workout';
import { Theme } from '../../styles/theme';

interface ExerciseWithDetail extends WorkoutLog {
  exerciseName: string;
}

export const RoutineDetailScreen = ({ route, navigation }: any) => {
  const { routineId } = route.params;
  const [routine, setRoutine] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<ExerciseWithDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDate, setLastDate] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await WorkoutService.getWorkoutWithDetails(routineId);
      if (data) {
        setRoutine(data.workout);
        setExercises(data.exercises);
        setLastDate(data.lastDate);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditRoutine', { routine: routine })}
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: Theme.colors.success, fontWeight: 'bold', fontSize: 16 }}>Editar</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, routine]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [routineId])
  );

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Theme.colors.success} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{routine?.name}</Text>
          <View style={styles.headerMeta}>
            {lastDate ? (
              <View style={styles.lastPerfContainer}>
                <Ionicons name="calendar-outline" size={14} color={Theme.colors.textSecondary} />
                <Text style={styles.lastPerfText}>
                  Visto por última vez: {new Date(lastDate).toLocaleDateString()}
                </Text>
              </View>
            ) : (
              <Text style={styles.lastPerfText}>Nunca entrenada</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EJERCICIOS ({exercises?.length || 0})</Text>
          {exercises && exercises.length > 0 ? (
            exercises.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.exerciseItem}
                onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.exerciseId })}
              >
                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseNumberContainer}>
                    <Text style={styles.exerciseNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.exerciseName}>{item.exerciseName}</Text>
                </View>
                <View style={styles.exerciseSideInfo}>
                  <Text style={styles.seriesCount}>{item.series.length} Sets</Text>
                  <Ionicons name="chevron-forward" size={16} color={Theme.colors.cardLight} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Sin ejercicios definidos</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.startBtn}
            onPress={async () => {
              if (!routine) return;
              const session = await WorkoutService.duplicateRoutine(routineId, routine.userId);
              navigation.navigate('EditRoutine', { routine: session });
            }}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.startBtnText}>EMPEZAR ENTRENAMIENTO</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  header: { padding: Theme.spacing.lg, backgroundColor: Theme.colors.card, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  title: { ...Theme.typography.h1, fontSize: 26 },
  headerMeta: { marginTop: 8 },
  lastPerfContainer: { flexDirection: 'row', alignItems: 'center' },
  lastPerfText: { ...Theme.typography.caption, marginLeft: 6, fontWeight: '700' },
  section: { padding: Theme.spacing.md },
  sectionTitle: { ...Theme.typography.caption, fontWeight: '900', letterSpacing: 1, marginBottom: Theme.spacing.md },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.lg,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  exerciseInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  exerciseNumberContainer: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Theme.colors.cardLight,
    justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.md
  },
  exerciseNumber: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '900' },
  exerciseName: { ...Theme.typography.h3, fontSize: 16, flex: 1 },
  exerciseSideInfo: { flexDirection: 'row', alignItems: 'center' },
  seriesCount: { ...Theme.typography.caption, fontSize: 13, fontWeight: '700', marginRight: 8 },
  footer: { padding: Theme.spacing.md, marginBottom: 40 },
  startBtn: {
    backgroundColor: Theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: Theme.roundness.lg,
    ...Theme.shadows.strong
  },
  startBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 10 },
  emptyCard: { padding: 30, backgroundColor: Theme.colors.card, borderRadius: Theme.roundness.lg, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.colors.border },
  emptyText: { ...Theme.typography.caption }
});
