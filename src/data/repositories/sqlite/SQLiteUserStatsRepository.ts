import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { UserStats } from '../../../domain/entities/User';
import { IUserStatsRepository } from '../../../domain/repositoriesInterface/IUserStatsRepository';

export class SQLiteUserStatsRepository implements IUserStatsRepository {

  /**
   * Guarda o reemplaza las estadísticas del usuario.
   * El 'OR REPLACE' es clave para que al sincronizar tras el login 
   * no falle por ID duplicado.
   */
  async save(stats: UserStats): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      `INSERT OR REPLACE INTO user_stats (
        userId, 
        currentXp, 
        level, 
        streakCount, 
        lastWorkoutDate
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        stats.userId, 
        stats.currentXp, 
        stats.level, 
        stats.streakCount, 
      ]
    );
  }

  async findByUserId(userId: string): Promise<UserStats | null> {
    const db = await SQLiteClient.getInstance();
    const result = await db.getFirstAsync<UserStats>(
      'SELECT * FROM user_stats WHERE userId = ?', 
      [userId]
    );
    return result || null;
  }

  /**
   * Actualiza estadísticas existentes.
   */
  async update(stats: UserStats): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      `UPDATE user_stats 
       SET currentXp = ?, level = ?, streakCount = ?, lastWorkoutDate = ? 
       WHERE userId = ?`,
      [
        stats.currentXp, 
        stats.level, 
        stats.streakCount,
        stats.userId
      ]
    );
  }

  /**
   * Elimina las estadísticas (útil para reseteo de cuenta).
   */
  async deleteByUserId(userId: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM user_stats WHERE userId = ?', [userId]);
  }
}