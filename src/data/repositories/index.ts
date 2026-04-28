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
 * HYBRID REPOSITORY - Gestión inteligente Local + Nube
 */
class HybridRepository<T> {
  constructor(
    protected local: any,
    protected cloud?: any
  ) {}

  async save(data: any): Promise<void> {
    // Primero aseguramos el dato en el dispositivo (SQLite)
    await this.local.save(data);
    
    // Luego intentamos subirlo a Firebase
    if (this.cloud) {
      try {
        await this.cloud.save(data);
      } catch (e) {
        console.warn("Cloud Sync (Save): Los datos se guardaron solo localmente.");
      }
    }
  }

  async update(data: any): Promise<void> {
    await this.local.update(data);
    if (this.cloud) {
      try {
        await this.cloud.update(data);
      } catch (e) {
        console.warn("Cloud Sync (Update): Cambio guardado solo en local.");
      }
    }
  }

  async delete(id: string): Promise<void> {
    // Detectamos si el repositorio usa 'delete' o 'deleteByUserId'
    const localDelete = this.local.delete ? this.local.delete.bind(this.local) : this.local.deleteByUserId.bind(this.local);
    await localDelete(id);

    if (this.cloud) {
      try {
        const cloudDelete = this.cloud.delete ? this.cloud.delete.bind(this.cloud) : this.cloud.deleteByUserId.bind(this.cloud);
        await cloudDelete(id);
      } catch (e) {
        console.warn("Cloud Sync (Delete): No se pudo eliminar en la nube.");
      }
    }
  }

  // Métodos de consulta (Siempre prioridad Local para velocidad)
  async findById(id: string) { return await this.local.findById(id); }
  async findByUserId(userId: string) { return await this.local.findByUserId(userId); }
  async findAllByUserId(userId: string) { return await this.local.findAllByUserId(userId); }
  async findInProgressByUserId(userId: string) { return await this.local.findInProgressByUserId(userId); }
}

// --- INSTANCIAS (SINGLETONS) ---

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