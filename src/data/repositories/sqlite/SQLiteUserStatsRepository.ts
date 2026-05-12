import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { UserStats } from '../../../domain/entities/User';
import { IUserStatsRepository } from '../../../domain/repositoriesInterface/IUserStatsRepository';

export class SQLiteUserStatsRepository implements IUserStatsRepository {
  async save(stats: UserStats): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      `INSERT INTO user_stats (userId, current_xp, level, streak_count, last_workout_date) 
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(userId) DO UPDATE SET
         current_xp=excluded.current_xp,
         level=excluded.level,
         streak_count=excluded.streak_count,
         last_workout_date=excluded.last_workout_date`,
      [stats.userId, stats.currentXp, stats.level, stats.streakCount, stats.lastWorkoutDate ?? null]
    );
  }

  async markAsSynced(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('UPDATE workouts SET sync_status = 0 WHERE id = ?', [id]);
  }

  async findByUserId(userId: string): Promise<UserStats | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>(
      'SELECT userId, current_xp as currentXp, level, streak_count as streakCount, last_workout_date as lastWorkoutDate FROM user_stats WHERE userId = ?', 
      [userId]
    );
    return row || null;
  }

  async update(stats: UserStats): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE user_stats SET current_xp = ?, level = ?, streak_count = ?, last_workout_date = ? WHERE userId = ?',
      [stats.currentXp, stats.level, stats.streakCount, stats.lastWorkoutDate ?? null, stats.userId]
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM user_stats WHERE userId = ?', [userId]);
  }
}