import { WorkoutRepository, LogRepository } from '../../data/repositories/index';
import { Workout } from '../../domain/entities/Workout';
import { LogService } from './LogService';

export const WorkoutService = {
  async startWorkout(userId: string, name: string): Promise<Workout> {
    const existing = await WorkoutRepository.findInProgressByUserId(userId);
    if (existing) return existing;

    const newWorkout: Workout = {
      id: `wk_${Date.now()}`,
      userId,
      name: name || "Nueva Plantilla",
      date: new Date().toISOString(),
      status: 'completed',
      isTemplate: true
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
        series: log.series.map((s, idx) => {
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