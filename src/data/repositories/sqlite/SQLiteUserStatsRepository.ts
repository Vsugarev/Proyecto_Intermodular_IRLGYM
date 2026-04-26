import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { UserStats } from '../../../domain/entities/User';
import { IUserStatsRepository } from '../../../domain/repositoriesInterface/IUserStatsRepository';

export class SQLiteUserStatsRepository implements IUserStatsRepository {

  async save(stats: UserStats): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT INTO user_stats (userId, currentXp, level, streakCount, lastWorkoutDate) VALUES (?, ?, ?, ?, ?)',
      [stats.userId, stats.currentXp, stats.level, stats.streakCount, stats.lastWorkoutDate ?? null]
    );
  }

  async findByUserId(userId: string): Promise<UserStats | null> {
    const db = await SQLiteClient.getInstance();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM user_stats WHERE userId = ?',
      [userId]
    );
    
    if (!result) return null;
    
    return {
      userId: result.userId,
      currentXp: result.currentXp,
      level: result.level,
      streakCount: result.streakCount,
      lastWorkoutDate: result.lastWorkoutDate
    };
  }

  async update(stats: UserStats): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE user_stats SET currentXp = ?, level = ?, streakCount = ?, lastWorkoutDate = ? WHERE userId = ?',
      [stats.currentXp, stats.level, stats.streakCount, stats.lastWorkoutDate ?? null, stats.userId]
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM user_stats WHERE userId = ?', [userId]);
  }
}