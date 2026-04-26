
import { SQLiteUserStatsRepository } from './sqlite/SQLiteUserStatsRepository';
import { SQLiteUserProfileRepository } from './sqlite/SQLiteUserProfileRepository';
import { SQLiteExerciseRepository } from './sqlite/SQLiteExerciseRepository';
import { SQLiteWorkoutRepository } from './sqlite/SQLiteWorkoutRepository';
import { SQLiteLogRepository } from './sqlite/SQLiteLogRepository';
import { SQLiteSkillRepository } from './sqlite/SQLiteSkillRepository';
import { SQLiteProgressRepository } from './sqlite/SQLiteProgressRepository';

import { FirebaseUserProfileRepository } from './firebase/FirebaseUserProfileRepository';
import { FirebaseWorkoutRepository } from './firebase/FirebaseWorkoutRepository';
import { FirebaseLogRepository } from './firebase/FirebaseLogRepository';
import { FirebaseUserStatsRepository } from './firebase/FirebaseUserStatsRepository';

import { IWorkoutRepository } from '../../domain/repositoriesInterface/IWorkoutRepository';
import { ILogRepository } from '../../domain/repositoriesInterface/ILogRepository';
import { IUserStatsRepository } from '../../domain/repositoriesInterface/IUserStatsRepository';
import { IUserProfileRepository } from '../../domain/repositoriesInterface/IUserProfileRepository';



/**
 * HYBRID REPOSITORY
 */
class HybridRepository<T> {
  constructor(
    protected local: any,
    protected cloud?: any
  ) {}

  async save(data: any): Promise<void> {
    await this.local.save(data);
    if (this.cloud) {
      try {
        await this.cloud.save(data);
      } catch (e) {
        console.warn("Cloud Sync: Fallo al guardar, se mantiene local.");
      }
    }
  }

  async update(data: any): Promise<void> {
    await this.local.update(data);
    if (this.cloud) {
      try {
        await this.cloud.update(data);
      } catch (e) {
        console.warn("Cloud Sync: Fallo al actualizar.");
      }
    }
  }

  async delete(id: string): Promise<void> {
    const localDelete = this.local.delete || this.local.deleteByUserId;
    await localDelete.call(this.local, id);

    if (this.cloud) {
      try {
        const cloudDelete = this.cloud.delete || this.cloud.deleteByUserId;
        await cloudDelete.call(this.cloud, id);
      } catch (e) {
        console.warn("Cloud Sync: Fallo al eliminar en la nube.");
      }
    }
  }

  async findById(id: string) { return await this.local.findById(id); }
  async findByUserId(userId: string) { return await this.local.findByUserId(userId); }
  async findAllByUserId(userId: string) { return await this.local.findAllByUserId(userId); }
  async findInProgressByUserId(userId: string) { return await this.local.findInProgressByUserId(userId); }
}

// --- INSTANCIAS ÚNICAS (SINGLETONS) ---

export const WorkoutRepository: IWorkoutRepository = new HybridRepository<IWorkoutRepository>(
  new SQLiteWorkoutRepository(),
  new FirebaseWorkoutRepository()
) as unknown as IWorkoutRepository;

export const LogRepository: ILogRepository = new HybridRepository<ILogRepository>(
  new SQLiteLogRepository(),
  new FirebaseLogRepository()
) as unknown as ILogRepository;

export const UserStatsRepository: IUserStatsRepository = new HybridRepository<IUserStatsRepository>(
  new SQLiteUserStatsRepository(),
  new FirebaseUserStatsRepository()
) as unknown as IUserStatsRepository;

export const UserProfileRepository: IUserProfileRepository = new HybridRepository<IUserProfileRepository>(
  new SQLiteUserProfileRepository(),
  new FirebaseUserProfileRepository()
) as unknown as IUserProfileRepository;

export const ExerciseRepository = new SQLiteExerciseRepository();
export const SkillRepository = new SQLiteSkillRepository();
export const ProgressRepository = new SQLiteProgressRepository();