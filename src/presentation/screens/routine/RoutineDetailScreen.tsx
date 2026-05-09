import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { Workout, WorkoutLog } from '../../../domain/entities/Workout';

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
          style={{ marginRight: 10 }}
        >
          <Text style={{ color: '#28a745', fontWeight: 'bold', fontSize: 16 }}>Editar</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, routine]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [routineId])
  );

  if (loading) return <ActivityIndicator style={styles.centered} color="#28a745" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{routine?.name}</Text>
        {lastDate && (
          <View style={styles.lastPerfContainer}>
            <Ionicons name="time-outline" size={14} color="#8e8e93" />
            <Text style={styles.lastPerfText}>
              Última vez: {new Date(lastDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ejercicios ({exercises?.length || 0})</Text>
        {exercises && exercises.length > 0 ? (
          exercises.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.exerciseItem}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.exerciseId })}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                <Text style={styles.exerciseName}>{item.exerciseName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.seriesCount}>{item.series.length} series</Text>
                <Ionicons name="chevron-forward" size={16} color="#c7c7cc" style={{ marginLeft: 5 }} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay ejercicios en esta rutina</Text>
        )}
      </View>

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 25, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  title: { fontSize: 24, fontWeight: '800', color: '#1c1c1e' },
  lastPerfContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  lastPerfText: { fontSize: 13, color: '#8e8e93', marginLeft: 4, fontWeight: '600' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#8e8e93', marginBottom: 15, textTransform: 'uppercase' },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  exerciseInfo: { flexDirection: 'row', alignItems: 'center' },
  exerciseNumber: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#f2f2f7',
    textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: 'bold',
    color: '#8e8e93', marginRight: 12
  },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#1c1c1e' },
  seriesCount: { fontSize: 14, color: '#8e8e93', fontWeight: '600' },
  startBtn: {
    margin: 20,
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#28a745',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  startBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  emptyText: { textAlign: 'center', color: '#8e8e93', marginTop: 20, fontStyle: 'italic' }
});
