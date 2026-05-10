import { WorkoutRepository, LogRepository } from '../../data/repositories/index';
import { Workout, Set } from '../../domain/entities/Workout';
import { LogService } from './LogService';

export const WorkoutService = {
  async createEmptyTemplate(userId: string, name: string): Promise<Workout> {
    const newWorkout: Workout = {
      id: `wk_${Date.now()}`,
      userId,
      name: name || "Nueva Plantilla",
      date: new Date().toISOString(),
      status: 'completed', // Las plantillas se guardan como completadas para que no salten como 'en curso'
      isTemplate: true
    };
    await WorkoutRepository.save(newWorkout);
    return newWorkout;
  },

  async startWorkout(userId: string, name: string): Promise<Workout> {
    const existing = await WorkoutRepository.findInProgressByUserId(userId);
    if (existing) return existing;

    const newWorkout: Workout = {
      id: `wk_${Date.now()}`,
      userId,
      name: name || "Nuevo Entrenamiento",
      date: new Date().toISOString(),
      status: 'in_progress',
      isTemplate: false
    };
    await WorkoutRepository.save(newWorkout);
    return newWorkout;
  },

  async getWorkoutsByUser(userId: string) {
    return await WorkoutRepository.findAllByUserId(userId);
  },

  async getWorkoutById(id: string): Promise<Workout | null> {
    const workout = await WorkoutRepository.findById(id);
    if (workout) {
      const logs = await LogRepository.findByWorkoutId(id);
      return { ...workout, logs };
    }
    return null;
  },

  async getWorkoutWithDetails(id: string) {
    const workout = await this.getWorkoutById(id);
    if (!workout) return null;

    const logs = workout.logs || [];
    const exercises = await Promise.all(
      logs.map(async (log) => {
        const { ExerciseRepository } = require('../../data/repositories/index');
        const ex = await ExerciseRepository.findById(log.exerciseId);
        return { ...log, exerciseName: ex?.name || 'Ejercicio eliminado' };
      })
    );

    const allWorkouts = await this.getWorkoutsByUser(workout.userId);
    const history = allWorkouts
      .filter((w: Workout) => w.name === workout.name && !w.isTemplate && w.status === 'completed')
      .sort((a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      workout,
      exercises,
      lastDate: history.length > 0 ? history[0].date : null
    };
  },

  async updateWorkout(workout: Workout) {
    await WorkoutRepository.update(workout);
  },

  async finishWorkout(workout: Workout) {
    await WorkoutRepository.update({ ...workout, status: 'completed' });
  },

  async deleteWorkout(id: string) {
    await WorkoutRepository.delete(id);
    await LogRepository.deleteByWorkoutId(id);
  },

  async duplicateRoutine(originalWorkoutId: string, userId: string): Promise<Workout> {
    const logs = await LogRepository.findByWorkoutId(originalWorkoutId);
    
    const newWorkout: Workout = {
      id: `wk_${Date.now()}`,
      userId,
      name: `Sesión: ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      status: 'in_progress',
      isTemplate: false,
      parentId: originalWorkoutId
    };
    
    await WorkoutRepository.save(newWorkout);
    
    for (const log of logs) {
      // Buscamos el último registro real de este ejercicio para auto-rellenar (Hevy style)
      const lastRealLog = await LogService.getLastLogForExercise(log.exerciseId, '');
      
      await LogRepository.save({
        ...log,
        id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        workoutId: newWorkout.id,
        // Respetamos el NÚMERO de series de la plantilla, pero rellenamos con valores previos
        series: log.series.map((s: Set, idx: number) => {
          const lastSeries = lastRealLog?.series[idx];
          return {
            ...s,
            kg: lastSeries ? lastSeries.kg : s.kg,
            reps: lastSeries ? lastSeries.reps : s.reps
          };
        }),
        sync_status: 1
      });
    }
    
    return newWorkout;
  }
};