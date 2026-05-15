import { Platform } from 'react-native';
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
    if (Platform.OS !== 'web') {
      await this.local.save(data);
    }
    try {
      await this.cloud.save(data);
      if (Platform.OS !== 'web' && this.local.markAsSynced) {
        await this.local.markAsSynced(data.id || data.userId);
      }
    } catch (error) {
      console.log("Offline or Cloud Error");
    }
  }

  async update(data: any) {
    if (Platform.OS !== 'web') {
      await this.local.update(data);
    }
    try {
      await this.cloud.update(data);
    } catch (e) {
      console.log("Error cloud update");
    }
  }

  async delete(id: string) {
    if (Platform.OS !== 'web') await this.local.delete(id);
    try {
      await this.cloud.delete(id);
    } catch (e) {
      console.log("Error cloud delete");
    }
  }

  async deleteByWorkoutId(workoutId: string) {
    if (Platform.OS !== 'web') await this.local.deleteByWorkoutId(workoutId);
    try {
      await this.cloud.deleteByWorkoutId(workoutId);
    } catch (e) {
      console.log("Error cloud deleteByWorkoutId");
    }
  }

  async deleteByExerciseId(exerciseId: string) {
    if (Platform.OS !== 'web' && this.local.deleteByExerciseId) {
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
    if (Platform.OS !== 'web' && this.local.deleteByUserId) {
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
    if (Platform.OS !== 'web' && this.local.resetAll) {
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

  async findById(id: string) { 
    if (Platform.OS === 'web') return await this.cloud.findById(id);
    return await this.local.findById(id); 
  }
  async findByUserId(userId: string) { 
    if (Platform.OS === 'web') return await this.cloud.findByUserId(userId);
    return await this.local.findByUserId(userId); 
  }
  async findAllByUserId(userId: string) { 
    if (Platform.OS === 'web') return await this.cloud.findAllByUserId(userId);
    return await this.local.findAllByUserId(userId); 
  }
  async findInProgressByUserId(userId: string) { 
    if (Platform.OS === 'web') return await this.cloud.findInProgressByUserId(userId);
    return await this.local.findInProgressByUserId(userId); 
  }
  async findByWorkoutId(workoutId: string) { 
    if (Platform.OS === 'web') return await this.cloud.findByWorkoutId(workoutId);
    return await this.local.findByWorkoutId(workoutId); 
  }
  async findByExerciseId(exerciseId: string, userId: string) { 
    if (Platform.OS === 'web') return await this.cloud.findByExerciseId(exerciseId, userId);
    return await this.local.findByExerciseId(exerciseId, userId); 
  }
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