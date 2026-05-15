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
      const lastRealLog = await LogService.getLastLogForExercise(log.exerciseId, '', userId);
      
      await LogRepository.save({
        ...log,
        id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        workoutId: newWorkout.id,
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
  },

  async createRewardWorkout(userId: string, routineName: string): Promise<void> {
    const workouts = await this.getWorkoutsByUser(userId);
    const exists = workouts.some((w: Workout) => w.name === routineName && w.isLocked);
    if (exists) return;

    const newWorkout: Workout = {
      id: `reward_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      name: routineName,
      date: new Date().toISOString(),
      status: 'completed',
      isTemplate: true,
      isLocked: true
    };

    await WorkoutRepository.save(newWorkout);

    let exerciseIds: string[] = [];
    if (routineName.includes('Fundamentos')) exerciseIds = ['ex_1', 'ex_2', 'ex_3']; // Press, Sentadilla, Peso Muerto
    else if (routineName.includes('Powerlifting')) exerciseIds = ['ex_1', 'ex_2', 'ex_3', 'ex_5']; 
    else if (routineName.includes('Calistenia')) exerciseIds = ['ex_4', 'ex_5', 'ex_26'];
    else if (routineName.includes('Hipertrofia')) exerciseIds = ['ex_10', 'ex_11', 'ex_12', 'ex_22'];
    else if (routineName.includes('ATLETA')) exerciseIds = ['ex_1', 'ex_2', 'ex_3', 'ex_4', 'ex_5', 'ex_8'];

    for (const exId of exerciseIds) {
      await LogRepository.save({
        id: `log_rw_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        workoutId: newWorkout.id,
        exerciseId: exId,
        series: [
          { kg: 0, reps: 0, type: 'R' },
          { kg: 0, reps: 0, type: 'R' },
          { kg: 0, reps: 0, type: 'R' }
        ]
      });
    }
  }
};