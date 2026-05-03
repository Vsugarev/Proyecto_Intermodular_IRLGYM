import { WorkoutRepository, LogRepository } from '../../data/repositories/index';
import { Workout } from '../../domain/entities/Workout';

export const WorkoutService = {
  async startWorkout(userId: string, name: string): Promise<Workout> {
    const existing = await WorkoutRepository.findInProgressByUserId(userId);
    if (existing) return existing;

    const newWorkout: Workout = {
      id: `wk_${Date.now()}`,
      userId,
      name: name || "Nuevo Entrenamiento",
      date: new Date().toISOString(),
      status: 'in_progress'
    };
    await WorkoutRepository.save(newWorkout);
    return newWorkout;
  },

  async getWorkoutsByUser(userId: string) {
    return await WorkoutRepository.findAllByUserId(userId);
  },

  async finishWorkout(workout: Workout) {
    await WorkoutRepository.update({ ...workout, status: 'completed' });
  },

  async deleteWorkout(id: string) {
    await WorkoutRepository.delete(id);
    await LogRepository.deleteByWorkoutId(id); // Borrado en cascada manual
  }
};