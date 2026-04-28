// data/repositories/index.ts
import { SQLiteWorkoutRepository } from './sqlite/SQLiteWorkoutRepository';
import { SQLiteLogRepository } from './sqlite/SQLiteLogRepository';
import { FirebaseLogRepository } from './firebase/FirebaseLogRepository';
import { SQLiteUserStatsRepository } from './sqlite/SQLiteUserStatsRepository';
import { FirebaseUserStatsRepository } from './firebase/FirebaseUserStatsRepository';
import { FirebaseWorkoutRepository } from './firebase/FirebaseWorkoutRepository';
import { SQLiteUserProfileRepository } from './sqlite/SQLiteUserProfileRepository';
import { FirebaseUserProfileRepository } from './firebase/FirebaseUserProfileRepository';
import { SQLiteExerciseRepository } from './sqlite/SQLiteExerciseRepository';
import { SQLiteSkillRepository } from './sqlite/SQLiteSkillRepository';
import { SQLiteProgressRepository } from './sqlite/SQLiteProgressRepository';

interface BaseRepository {
  save: (data: any) => Promise<void>;
}

class HybridRepository<T extends BaseRepository> {
  constructor(private local: any, private cloud: any) {}

  async save(data: any) {
    await this.local.save(data);

    try {
      await this.cloud.save(data);
      console.log("Guardado en la nube también.");

      if (this.local.markAsSynced) {
        await this.local.markAsSynced(data.id);
      }
    } catch (error) {
      console.log("Sin conexión, se subirá más tarde mediante SyncManager.");
    }
  }

  async findById(id: string) { return await this.local.findById(id); }
  async findByUserId(userId: string) { return await this.local.findByUserId(userId); }
  async findAllByUserId(userId: string) { return await this.local.findAllByUserId(userId); }
  async findInProgressByUserId(userId: string) { return await this.local.findInProgressByUserId(userId); }
}

export const WorkoutRepository = new HybridRepository(
  new SQLiteWorkoutRepository(),
  new FirebaseWorkoutRepository()
) as any;

export const LogRepository = new HybridRepository(
  new SQLiteLogRepository(),
  new FirebaseLogRepository()
) as any;

export const UserStatsRepository = new HybridRepository(
  new SQLiteUserStatsRepository(),
  new FirebaseUserStatsRepository()
) as any;

export const UserProfileRepository = new HybridRepository(
    new SQLiteUserProfileRepository(),
    new FirebaseUserProfileRepository()
) as any;

export const ExerciseRepository = new SQLiteExerciseRepository();
export const SkillRepository = new SQLiteSkillRepository();
export const ProgressRepository = new SQLiteProgressRepository();