import { SQLiteWorkoutRepository } from './sqlite/SQLiteWorkoutRepository';
import { SQLiteLogRepository } from './sqlite/SQLiteLogRepository';
import { SQLiteUserStatsRepository } from './sqlite/SQLiteUserStatsRepository';
import { SQLiteUserProfileRepository } from './sqlite/SQLiteUserProfileRepository';
import { SQLiteExerciseRepository } from './sqlite/SQLiteExerciseRepository';
import { SQLiteSkillRepository } from './sqlite/SQLiteSkillRepository';
import { SQLiteProgressRepository } from './sqlite/SQLiteProgressRepository';

import { FirebaseWorkoutRepository } from './firebase/FirebaseWorkoutRepository';
import { FirebaseLogRepository } from './firebase/FirebaseLogRepository';
import { FirebaseUserStatsRepository } from './firebase/FirebaseUserStatsRepository';
import { FirebaseUserProfileRepository } from './firebase/FirebaseUserProfileRepository';
import { FirebaseProgressRepository } from './firebase/FirebaseProgressRepository';
import { FirebaseExerciseRepository } from './firebase/FirebaseExerciseRepository';

class HybridRepository {
  constructor(private local: any, private cloud: any) {}

  async save(data: any) {
    await this.local.save(data);
    try {
      await this.cloud.save(data);
      if (this.local.markAsSynced) {
        await this.local.markAsSynced(data.id || data.userId);
      }
    } catch (error) {
      console.log("Offline");
    }
  }

  async update(data: any) {
    await this.local.update(data);
    try {
      await this.cloud.update(data);
    } catch (e) {
      console.log("Error cloud update");
    }
  }

  async delete(id: string) {
    await this.local.delete(id);
    try {
      await this.cloud.delete(id);
    } catch (e) {
      console.log("Error cloud delete");
    }
  }

  async deleteByWorkoutId(workoutId: string) {
    await this.local.deleteByWorkoutId(workoutId);
    try {
      await this.cloud.deleteByWorkoutId(workoutId);
    } catch (e) {
      console.log("Error cloud deleteByWorkoutId");
    }
  }

  async deleteByExerciseId(exerciseId: string) {
    if (this.local.deleteByExerciseId) {
      await this.local.deleteByExerciseId(exerciseId);
    }
    try {
      if (this.cloud.deleteByExerciseId) {
        await this.cloud.deleteByExerciseId(exerciseId);
      }
    } catch (e) {
      console.log("Error cloud deleteByExerciseId");
    }
  }

  async deleteByUserId(userId: string) {
    if (this.local.deleteByUserId) {
      await this.local.deleteByUserId(userId);
    }
    try {
      if (this.cloud.deleteByUserId) {
        await this.cloud.deleteByUserId(userId);
      }
    } catch (e) {
      console.log("Error cloud deleteByUserId");
    }
  }

  async resetAll(userId: string) {
    if (this.local.resetAll) {
      await this.local.resetAll(userId);
    }
    try {
      if (this.cloud.resetAll) {
        await this.cloud.resetAll(userId);
      }
    } catch (e) {
      console.log("Error cloud resetAll");
    }
  }

  async findById(id: string) { return await this.local.findById(id); }
  async findByUserId(userId: string) { return await this.local.findByUserId(userId); }
  async findAllByUserId(userId: string) { return await this.local.findAllByUserId(userId); }
  async findInProgressByUserId(userId: string) { return await this.local.findInProgressByUserId(userId); }
  async findByWorkoutId(workoutId: string) { return await this.local.findByWorkoutId(workoutId); }
  async findByExerciseId(exerciseId: string) { return await this.local.findByExerciseId(exerciseId); }
}

export const WorkoutRepository = new HybridRepository(new SQLiteWorkoutRepository(), new FirebaseWorkoutRepository());
export const LogRepository = new HybridRepository(new SQLiteLogRepository(), new FirebaseLogRepository());
export const UserStatsRepository = new HybridRepository(new SQLiteUserStatsRepository(), new FirebaseUserStatsRepository());
export const UserProfileRepository = new HybridRepository(new SQLiteUserProfileRepository(), new FirebaseUserProfileRepository());

export const CloudUserProfileRepository = new FirebaseUserProfileRepository();
export const CloudUserStatsRepository = new FirebaseUserStatsRepository();
export const CloudProgressRepository = new FirebaseProgressRepository();
export const CloudExerciseRepository = new FirebaseExerciseRepository();
export const CloudWorkoutRepository = new FirebaseWorkoutRepository();
export const CloudLogRepository = new FirebaseLogRepository();

export const ExerciseRepository = new SQLiteExerciseRepository();
export const SkillRepository = new SQLiteSkillRepository();
export const ProgressRepository = new HybridRepository(new SQLiteProgressRepository(), new FirebaseProgressRepository());