import { LogRepository, WorkoutRepository } from '../../data/repositories/index';
import { WorkoutLog, Set } from '../../domain/entities/Workout';

export const LogService = {
  async createLog(workoutId: string, exerciseId: string, series: Set[]) {
    const log: WorkoutLog = {
      id: `log_${Date.now()}`, workoutId, exerciseId, series, note: ""
    };
    await LogRepository.save(log);
    return log;
  },

  async getLogsByWorkout(workoutId: string): Promise<WorkoutLog[]> {
    return await LogRepository.findByWorkoutId(workoutId);
  },

  async updateSeries(logId: string, newSeries: Set[]) {
    const log = await LogRepository.findById(logId);
    if (log) {
      await LogRepository.update({ ...log, series: newSeries });
    }
  },

  async updateLog(log: WorkoutLog) {
    await LogRepository.update(log);
  },

  async saveLog(log: WorkoutLog) {
    await LogRepository.save(log);
  },

  async deleteLog(logId: string) {
    await LogRepository.delete(logId);
  },

  async getLastLogForExercise(exerciseId: string, excludeWorkoutId: string, userId: string): Promise<WorkoutLog | null> {
    const allLogs = await LogRepository.findByExerciseId(exerciseId, userId);
    
    const validLogs = [];
    for (const log of allLogs) {
      if (log.workoutId === excludeWorkoutId) continue;
      
      const workout = await WorkoutRepository.findById(log.workoutId);
      if (workout && workout.userId === userId && !workout.isTemplate && workout.status === 'completed') {
        validLogs.push(log);
      }
    }

    const sortedLogs = validLogs.sort((a, b) => b.id.localeCompare(a.id));
    return sortedLogs.length > 0 ? sortedLogs[0] : null;
  }
};