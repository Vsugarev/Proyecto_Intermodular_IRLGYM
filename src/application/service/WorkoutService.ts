import { WorkoutRepository, LogRepository } from '../../data/repositories/index';
import { auth } from '../../infrastructure/config/firebase';

export const WorkoutService = {
  async getUserWorkouts(userId: string) {
    if (!userId) throw new Error("userId es requerido");
    return await WorkoutRepository.findAllByUserId(userId);
  },

  async getWorkoutLogs(workoutId: string) {
    return await LogRepository.findByWorkoutId(workoutId);
  },

  async createWorkout(name: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("No hay sesión activa");

    const workout = {
      id: Date.now().toString(),
      userId: user.uid,
      name: name,
      date: new Date().toISOString(),
      status: 'in_progress',
      sync_status: 1
    };
    await WorkoutRepository.save(workout);
    return workout;
  },

  async updateWorkoutName(id: string, name: string) {
    const workout = await WorkoutRepository.findById(id);
    if (!workout) throw new Error("Entrenamiento no encontrado");
    
    const updatedWorkout = { ...workout, name, sync_status: 1 };
    await WorkoutRepository.save(updatedWorkout);
    return updatedWorkout;
  },

  async deleteWorkout(id: string) {
    await WorkoutRepository.delete(id);
  },

  async addExerciseLog(workoutId: string, exerciseId: string, series: any[]) {
    const log = {
      id: Date.now().toString(),
      workoutId: workoutId,
      exerciseId: exerciseId,
      series: series,
      note: ""
    };
    await LogRepository.save(log);
    return log;
  },

  async deleteExerciseLog(logId: string) {
    await LogRepository.delete(logId);
  }
};