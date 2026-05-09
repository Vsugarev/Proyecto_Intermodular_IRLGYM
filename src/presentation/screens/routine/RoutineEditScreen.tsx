import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { LogService } from '../../../application/service/LogService';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { WorkoutLog, Set } from '../../../domain/entities/Workout';

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
      
      // Guardamos la huella digital de la estructura original (Rutine-view-03 Smart)
      const structure = logsWithDetails.map(ex => `${ex.exerciseId}:${ex.series.length}`).join('|');
      setOriginalStructure(structure);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async () => {
    if (saving) return;

    // Calculamos la estructura actual para ver si ha cambiado (Smart Alert)
    const currentStructure = exercises.map(ex => `${ex.exerciseId}:${ex.series.length}`).join('|');
    const hasStructureChanged = currentStructure !== originalStructure;

    if (routine?.status === 'in_progress' && routine?.parentId && hasStructureChanged) {
      Alert.alert(
        "¿Actualizar rutina original?",
        "Has detectado cambios en la estructura (ejercicios o series). ¿Quieres guardarlos como el nuevo estándar de esta rutina?",
        [
          { 
            text: "No, solo hoy", 
            onPress: () => performSave(false),
            style: "cancel"
          },
          { 
            text: "Sí, actualizar", 
            onPress: () => performSave(true) 
          }
        ]
      );
    } else {
      // Si no hay cambios estructurales o no hay parentId, guardamos normal
      performSave(false);
    }
  };

  const performSave = async (updateTemplate: boolean) => {
    try {
      setSaving(true);
      const updatedStatus = routine?.status === 'in_progress' ? 'completed' : routine?.status;
      
      // 1. Guardamos la sesión actual
      await WorkoutService.updateWorkout({ ...routine, name, status: updatedStatus });
      for (const log of exercises) {
        await LogService.saveLog(log);
      }

      // 2. Si el usuario quiere que esta sea su nueva "plantilla" predeterminada
      if (updateTemplate && routine.parentId) {
        // Actualizamos también el nombre de la rutina original por si lo ha cambiado
        const parentWorkout = await WorkoutService.getWorkoutById(routine.parentId);
        if (parentWorkout) {
          await WorkoutService.updateWorkout({ ...parentWorkout, name });
          
          // Reemplazamos los ejercicios de la plantilla por los actuales (Hevy style)
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
      console.error(e);
      Alert.alert("Error", "No se pudo guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      "Descartar", 
      "¿Estás seguro de que quieres borrar este entrenamiento? Se perderán todos los datos registrados.", 
      [
        { text: "No, continuar", style: "cancel" },
        { 
          text: "Sí, borrar", 
          style: "destructive", 
          onPress: async () => {
            await WorkoutService.deleteWorkout(routine.id);
            navigation.goBack();
          } 
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert("Eliminar", "¿Borrar esta rutina?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar", style: "destructive", onPress: async () => {
          await WorkoutService.deleteWorkout(routine.id);
          navigation.goBack();
        }
      }
    ]);
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

  const removeSet = (logId: string, setIndex: number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === logId) {
        return { ...ex, series: ex.series.filter((_, i) => i !== setIndex) };
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

  const removeExercise = (logId: string) => {
    Alert.alert("Eliminar", "¿Quitar este ejercicio?", [
      { text: "No", style: "cancel" },
      { text: "Sí", style: "destructive", onPress: () => {
        setExercises(prev => prev.filter(ex => ex.id !== logId));
      }}
    ]);
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...exercises];
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= newExercises.length) return;
    [newExercises[index], newExercises[nextIndex]] = [newExercises[nextIndex], newExercises[index]];
    setExercises(newExercises);
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
          <Text style={styles.previousLabel}>{prevSet ? `${prevSet.kg}kg` : '-'}</Text>
          <TextInput
            style={styles.setInput}
            keyboardType="numeric"
            value={set.kg === 0 ? '' : set.kg.toString()}
            onChangeText={(v) => updateSet(logId, index, 'kg', v)}
            placeholder="0"
            selectTextOnFocus
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Text style={styles.previousLabel}>{prevSet ? `${prevSet.reps} reps` : '-'}</Text>
          <TextInput
            style={styles.setInput}
            keyboardType="numeric"
            value={set.reps === 0 ? '' : set.reps.toString()}
            onChangeText={(v) => updateSet(logId, index, 'reps', v)}
            placeholder="0"
            selectTextOnFocus
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.previousLabel}>{prevSet && prevSet.rpe ? `RPE ${prevSet.rpe}` : '-'}</Text>
          <TextInput
            style={styles.setInput}
            keyboardType="numeric"
            value={set.rpe === 0 ? '' : set.rpe?.toString()}
            onChangeText={(v) => updateSet(logId, index, 'rpe', v)}
            placeholder="0"
            selectTextOnFocus
          />
        </View>

        <TouchableOpacity onPress={() => removeSet(logId, index)} style={styles.deleteSetBtn}>
          <Ionicons name="close-circle-outline" size={20} color="#ff4444" />
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
        <View style={styles.exerciseActions}>
          <TouchableOpacity onPress={() => moveExercise(index, 'up')} style={styles.actionIcon}>
            <Ionicons name="chevron-up" size={20} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => moveExercise(index, 'down')} style={styles.actionIcon}>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeExercise(item.id)} style={styles.actionIcon}>
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.setTableHeader}>
        <Text style={[styles.setTableLabel, { width: 40 }]}>SERIE</Text>
        <Text style={[styles.setTableLabel, { flex: 1 }]}>KG</Text>
        <Text style={[styles.setTableLabel, { flex: 1 }]}>REPS</Text>
        <Text style={[styles.setTableLabel, { flex: 1 }]}>RPE</Text>
        <View style={{ width: 30 }} />
      </View>

      {item.series.map((set, idx) => renderSetRow(set, idx, item.id))}

      <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(item.id)}>
        <Text style={styles.addSetText}>+ AÑADIR SERIE</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.sectionLabel}>Nombre de la Rutina</Text>
            <TextInput 
              style={styles.routineNameInput} 
              value={name} 
              onChangeText={setName}
              placeholder="Ej: Empuje A"
            />
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity style={styles.addExerciseBtn} onPress={openExerciseLibrary}>
              <Ionicons name="add-circle" size={24} color="#28a745" />
              <Text style={styles.addExerciseText}>AÑADIR EJERCICIO</Text>
            </TouchableOpacity>

            <View style={styles.finalActions}>
              <TouchableOpacity 
                style={[styles.saveBtn, routine?.status === 'in_progress' && styles.finishBtn, saving && { opacity: 0.7 }]} 
                onPress={handleUpdate}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'GUARDANDO...' : (routine?.status === 'in_progress' ? 'FINALIZAR ENTRENAMIENTO' : 'GUARDAR RUTINA')}
                </Text>
              </TouchableOpacity>
              
              {routine?.status === 'in_progress' ? (
                <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
                  <Text style={styles.discardBtnText}>DESCARTAR ENTRENAMIENTO</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.deleteRoutineBtn} onPress={handleDelete}>
                  <Text style={styles.deleteRoutineText}>Eliminar Rutina</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 16, backgroundColor: '#f5f5f7' },
  header: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#8e8e93', marginBottom: 8, textTransform: 'uppercase' },
  routineNameInput: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#000', 
    backgroundColor: 'transparent',
    padding: 0
  },
  exerciseCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  exerciseName: { fontSize: 18, fontWeight: '700', color: '#000' },
  exerciseActions: { flexDirection: 'row' },
  actionIcon: { marginLeft: 15 },
  setTableHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4 },
  setTableLabel: { fontSize: 10, fontWeight: 'bold', color: '#8e8e93', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  inputWrapper: { flex: 1, marginHorizontal: 2 },
  previousLabel: { fontSize: 9, color: '#c7c7cc', textAlign: 'center', marginBottom: 2, fontWeight: '600' },
  setTypeBadge: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#eee'
  },
  setType_R: { backgroundColor: '#e5e5ea' },
  setType_W: { backgroundColor: '#ffcc00' },
  setType_D: { backgroundColor: '#af52de' },
  setType_F: { backgroundColor: '#ff3b30' },
  setTypeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  setInput: { 
    flex: 1, 
    backgroundColor: '#f2f2f7', 
    borderRadius: 6, 
    height: 36, 
    textAlign: 'center', 
    fontSize: 15, 
    fontWeight: '600',
    color: '#1c1c1e',
    paddingVertical: 0
  },
  deleteSetBtn: { width: 30, alignItems: 'center', marginLeft: 5 },
  addSetBtn: { 
    marginTop: 10, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#f2f2f7' 
  },
  addSetText: { color: '#28a745', fontWeight: 'bold', fontSize: 13 },
  footer: { marginTop: 10, marginBottom: 40 },
  addExerciseBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 15, 
    backgroundColor: '#fff', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderStyle: 'dashed'
  },
  addExerciseText: { marginLeft: 8, color: '#28a745', fontWeight: 'bold' },
  finalActions: { marginTop: 30 },
  saveBtn: { 
    backgroundColor: '#28a745', 
    padding: 18, 
    borderRadius: 14, 
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  finishBtn: { backgroundColor: '#007aff', shadowColor: '#007aff' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  deleteRoutineBtn: { marginTop: 20, alignItems: 'center' },
  deleteRoutineText: { color: '#ff3b30', fontWeight: '600' },
  discardBtn: { marginTop: 20, alignItems: 'center', backgroundColor: '#ffe5e5', padding: 15, borderRadius: 12 },
  discardBtnText: { color: '#ff3b30', fontWeight: 'bold', fontSize: 14 }
});