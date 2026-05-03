import { LogRepository } from '../../data/repositories/index';
import { WorkoutLog, Set } from '../../domain/entities/Workout';

export const LogService = {
  async createLog(workoutId: string, exerciseId: string, series: Set[]) {
    const log: WorkoutLog = {
      id: `log_${Date.now()}`, workoutId, exerciseId, series, note: ""
    };
    await LogRepository.save(log);
    return log;
  },

  async getLogsByWorkout(workoutId: string) {
    return await LogRepository.findByWorkoutId(workoutId);
  },

  async updateLog(log: WorkoutLog) {
    await LogRepository.update(log);
  },

  async deleteLog(logId: string) {
    await LogRepository.delete(logId);
  }
};