// data/repositories/syncManager.ts
import { SQLiteWorkoutRepository } from './sqlite/SQLiteWorkoutRepository';
import { SQLiteLogRepository } from './sqlite/SQLiteLogRepository';
import { SQLiteUserStatsRepository } from './sqlite/SQLiteUserStatsRepository';

import { FirebaseWorkoutRepository } from './firebase/FirebaseWorkoutRepository';
import { FirebaseLogRepository } from './firebase/FirebaseLogRepository';
import { FirebaseUserStatsRepository } from './firebase/FirebaseUserStatsRepository';

class SyncManager {
  private localWorkout = new SQLiteWorkoutRepository();
  private localLog = new SQLiteLogRepository();
  private localStats = new SQLiteUserStatsRepository();

  private cloudWorkout = new FirebaseWorkoutRepository();
  private cloudLog = new FirebaseLogRepository();
  private cloudStats = new FirebaseUserStatsRepository();

  async syncEverything(userId: string) {
    console.log("Sincronizando con la nube...");
    try {
      await this.syncWorkoutsAndLogs(userId);
      await this.syncStats(userId);
      console.log("¡Todo sincronizado!");
    } catch (error) {
      console.error("Error en la sincronización:", error);
    }
  }

  private async syncWorkoutsAndLogs(userId: string) {
    const allWorkouts = await this.localWorkout.findAllByUserId(userId);
    const pendingWorkouts = allWorkouts.filter((w: any) => w.sync_status === 1);

    for (const workout of pendingWorkouts) {
      await this.cloudWorkout.save(workout);

      const logs = await this.localLog.findByWorkoutId(workout.id);
      for (const log of logs) {
        await this.cloudLog.save(log);
      }

      await this.localWorkout.markAsSynced(workout.id);
    }
  }

  private async syncStats(userId: string) {
    const stats = await this.localStats.findByUserId(userId);
    if (stats && (stats as any).is_dirty === 1) {
      await this.cloudStats.save(stats);
      await this.localStats.update({ ...stats, is_dirty: 0 } as any);
    }
  }
}

export const syncManager = new SyncManager();