import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { LogService } from '../../../application/service/LogService';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { SkillService } from '../../../application/service/SkillService';
import { WorkoutLog, Set } from '../../../domain/entities/Workout';
import { Theme } from '../../styles/theme';

interface ExerciseWithLog extends WorkoutLog {
  exerciseName: string;
  previousSeries?: Set[];
}

const SET_TYPES: Set['type'][] = ['R', 'W', 'D', 'F'];

export const RoutineEditScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { routine } = route.params || {};
  const [name, setName] = useState(routine?.name || '');
  const [exercises, setExercises] = useState<ExerciseWithLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [originalStructure, setOriginalStructure] = useState<string>('');

  useEffect(() => {
    if (routine?.id) loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const logs = await LogService.getLogsByWorkout(routine.id);
      const logsWithDetails = await Promise.all(logs.map(async (log: WorkoutLog) => {
        const exercise = await ExerciseService.getExerciseById(log.exerciseId);
        const lastLog = await LogService.getLastLogForExercise(log.exerciseId, routine.id);
        return { 
          ...log, 
          exerciseName: exercise?.name || 'Ejercicio desconocido',
          previousSeries: lastLog?.series
        } as ExerciseWithLog;
      }));
      setExercises(logsWithDetails);
      const structure = logsWithDetails.map(ex => `${ex.exerciseId}:${ex.series.length}`).join('|');
      setOriginalStructure(structure);
    } catch (e) {
      console.error(e);
    }
  };

  const performSave = async (updateTemplate: boolean) => {
    try {
      setSaving(true);
      const updatedStatus = routine?.status === 'in_progress' ? 'completed' : routine?.status;
      await WorkoutService.updateWorkout({ ...routine, name, status: updatedStatus });
      for (const log of exercises) {
        await LogService.saveLog(log);
      }

      if (routine?.status === 'in_progress' && updatedStatus === 'completed' && routine.userId) {
        const xpEarned = 100 + (exercises.length * 20);
        await SkillService.addExperience(routine.userId, xpEarned);
      }

      if (updateTemplate && routine.parentId) {
        const parentWorkout = await WorkoutService.getWorkoutById(routine.parentId);
        if (parentWorkout) {
          await WorkoutService.updateWorkout({ ...parentWorkout, name });
          const { LogRepository } = require('../../../data/repositories/index');
          await LogRepository.deleteByWorkoutId(routine.parentId);
          for (const log of exercises) {
            await LogService.saveLog({
              ...log,
              id: `log_tpl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              workoutId: routine.parentId,
              series: log.series.map(s => ({ ...s, kg: 0, reps: 0 }))
            });
          }
        }
      }

      Alert.alert("Éxito", routine?.status === 'in_progress' ? "Entrenamiento finalizado" : "Cambios guardados");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (saving) return;
    const currentStructure = exercises.map(ex => `${ex.exerciseId}:${ex.series.length}`).join('|');
    const hasStructureChanged = currentStructure !== originalStructure;

    if (routine?.status === 'in_progress' && routine?.parentId && hasStructureChanged) {
      Alert.alert(
        "¿Actualizar plantilla?",
        "¿Quieres guardar estos cambios de estructura en la rutina original?",
        [
          { text: "No, solo hoy", onPress: () => performSave(false), style: "cancel" },
          { text: "Sí, actualizar", onPress: () => performSave(true) }
        ]
      );
    } else {
      performSave(false);
    }
  };

  const addSet = (logId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === logId) {
        const lastSet = ex.series[ex.series.length - 1];
        return {
          ...ex,
          series: [...ex.series, { 
            kg: lastSet?.kg || 0, 
            reps: lastSet?.reps || 0, 
            type: 'R', 
            rpe: lastSet?.rpe || 0 
          }]
        };
      }
      return ex;
    }));
  };

  const updateSet = (logId: string, setIndex: number, field: keyof Set, value: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === logId) {
        const newSeries = [...ex.series];
        let numValue = parseFloat(value) || 0;
        if (field === 'type') {
          newSeries[setIndex] = { ...newSeries[setIndex], [field]: value as any };
        } else {
          newSeries[setIndex] = { ...newSeries[setIndex], [field]: numValue };
        }
        return { ...ex, series: newSeries };
      }
      return ex;
    }));
  };

  const cycleSetType = (logId: string, setIndex: number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === logId) {
        const newSeries = [...ex.series];
        const currentType = newSeries[setIndex].type;
        const currentIndex = SET_TYPES.indexOf(currentType);
        const nextIndex = (currentIndex + 1) % SET_TYPES.length;
        newSeries[setIndex] = { ...newSeries[setIndex], type: SET_TYPES[nextIndex] };
        return { ...ex, series: newSeries };
      }
      return ex;
    }));
  };

  const openExerciseLibrary = () => {
    navigation.navigate('ExerciseLibrary', {
      isSelecting: true,
      onSelect: (selectedExercise: any) => {
        const newLog: ExerciseWithLog = {
          id: `log_${Date.now()}`,
          exerciseId: selectedExercise.id,
          exerciseName: selectedExercise.name,
          workoutId: routine.id,
          series: [{ kg: 0, reps: 0, type: 'R', rpe: 0 }]
        };
        setExercises(prev => [...prev, newLog]);
      }
    });
  };

  const renderSetRow = (set: Set, index: number, logId: string) => {
    const log = exercises.find(ex => ex.id === logId);
    const prevSet = log?.previousSeries && log.previousSeries[index];

    return (
      <View key={`${logId}-set-${index}`} style={styles.setRow}>
        <TouchableOpacity 
          style={[styles.setTypeBadge, (styles as any)[`setType_${set.type}`]]} 
          onPress={() => cycleSetType(logId, index)}
        >
          <Text style={styles.setTypeText}>{set.type === 'R' ? index + 1 : set.type}</Text>
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <Text style={styles.previousLabel}>{prevSet ? `${prevSet.kg}k` : '-'}</Text>
          <TextInput
            style={styles.setInput}
            keyboardType="numeric"
            value={set.kg === 0 ? '' : set.kg.toString()}
            onChangeText={(v) => updateSet(logId, index, 'kg', v)}
            placeholder="0"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Text style={styles.previousLabel}>{prevSet ? `${prevSet.reps}r` : '-'}</Text>
          <TextInput
            style={styles.setInput}
            keyboardType="numeric"
            value={set.reps === 0 ? '' : set.reps.toString()}
            onChangeText={(v) => updateSet(logId, index, 'reps', v)}
            placeholder="0"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.previousLabel}>{prevSet && prevSet.rpe ? `E${prevSet.rpe}` : '-'}</Text>
          <TextInput
            style={styles.setInput}
            keyboardType="numeric"
            value={set.rpe === 0 ? '' : set.rpe?.toString()}
            onChangeText={(v) => updateSet(logId, index, 'rpe', v)}
            placeholder="0"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <TouchableOpacity onPress={() => {}} style={styles.deleteSetBtn}>
          <Ionicons name="trash-outline" size={16} color={Theme.colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderExerciseItem = ({ item, index }: { item: ExerciseWithLog, index: number }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <TouchableOpacity 
          style={{ flex: 1 }} 
          onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.exerciseId })}
        >
          <Text style={styles.exerciseName}>{item.exerciseName}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            "Eliminar Ejercicio",
            "¿Estás seguro de que quieres quitar este ejercicio de la rutina?",
            [
              { text: "Cancelar", style: "cancel" },
              { 
                text: "Eliminar", 
                style: "destructive", 
                onPress: () => setExercises(prev => prev.filter(ex => ex.id !== item.id)) 
              }
            ]
          );
        }}>
          <Ionicons name="trash-outline" size={20} color={Theme.colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.setTableHeader}>
        <Text style={[styles.setTableLabel, { width: 32 }]}>SET</Text>
        <Text style={[styles.setTableLabel, { flex: 1 }]}>PESO</Text>
        <Text style={[styles.setTableLabel, { flex: 1 }]}>REPS</Text>
        <Text style={[styles.setTableLabel, { flex: 1 }]}>RPE</Text>
        <View style={{ width: 24 }} />
      </View>

      {item.series.map((set, idx) => renderSetRow(set, idx, item.id))}

      <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(item.id)}>
        <Ionicons name="add" size={16} color={Theme.colors.success} />
        <Text style={styles.addSetText}>AÑADIR SERIE</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <TextInput 
                style={styles.routineNameInput} 
                value={name} 
                onChangeText={setName}
                placeholder="Nombre de la rutina"
                placeholderTextColor={Theme.colors.textSecondary}
              />
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <TouchableOpacity style={styles.addExerciseBtn} onPress={openExerciseLibrary}>
                <Ionicons name="add-circle" size={20} color={Theme.colors.success} />
                <Text style={styles.addExerciseText}>AÑADIR EJERCICIO</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, routine?.status === 'in_progress' && styles.finishBtn]} 
                onPress={handleUpdate}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'GUARDANDO...' : (routine?.status === 'in_progress' ? 'FINALIZAR' : 'GUARDAR')}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  listContent: { padding: Theme.spacing.md },
  header: { marginBottom: Theme.spacing.lg, marginTop: Theme.spacing.md },
  routineNameInput: { ...Theme.typography.h1, fontSize: 26, padding: 0 },
  exerciseCard: { 
    backgroundColor: Theme.colors.card, 
    borderRadius: Theme.roundness.lg, 
    padding: Theme.spacing.md, 
    marginBottom: Theme.spacing.md,
    borderWidth: 1, borderColor: Theme.colors.border
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  exerciseName: { ...Theme.typography.h3, color: Theme.colors.primary },
  setTableHeader: { flexDirection: 'row', marginBottom: 10 },
  setTableLabel: { ...Theme.typography.caption, fontSize: 9, fontWeight: '900', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inputWrapper: { flex: 1, marginHorizontal: 3 },
  previousLabel: { ...Theme.typography.caption, fontSize: 8, textAlign: 'center', marginBottom: 2 },
  setTypeBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  setType_R: { backgroundColor: Theme.colors.cardLight },
  setType_W: { backgroundColor: Theme.colors.warning },
  setType_D: { backgroundColor: Theme.colors.primary },
  setType_F: { backgroundColor: Theme.colors.danger },
  setTypeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  setInput: { 
    backgroundColor: Theme.colors.cardLight, borderRadius: 6, height: 34, 
    textAlign: 'center', fontSize: 14, fontWeight: '700', color: Theme.colors.text
  },
  deleteSetBtn: { width: 24, alignItems: 'center' },
  addSetBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Theme.colors.border
  },
  addSetText: { color: Theme.colors.success, fontWeight: '800', fontSize: 12 },
  footer: { marginTop: Theme.spacing.md, marginBottom: 40 },
  addExerciseBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 15, backgroundColor: Theme.colors.card, borderRadius: Theme.roundness.md,
    borderWidth: 1, borderColor: Theme.colors.border, borderStyle: 'dashed', marginBottom: 25
  },
  addExerciseText: { marginLeft: 8, color: Theme.colors.success, fontWeight: '800' },
  saveBtn: { backgroundColor: Theme.colors.success, padding: 18, borderRadius: Theme.roundness.lg, alignItems: 'center' },
  finishBtn: { backgroundColor: Theme.colors.primary },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 }
});