import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { UserProgressNode } from '../../../domain/entities/SkillNode';
import { IProgressRepository } from '../../../domain/repositoriesInterface/IProgressRepository';

export class SQLiteProgressRepository implements IProgressRepository {
  async save(progress: UserProgressNode): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO user_progress_nodes (userId, nodeId, status, current_progress, sync_status) VALUES (?, ?, ?, ?, ?)',
      [progress.userId, progress.nodeId, progress.status, progress.currentProgress, 1]
    );
  }

  async find(userId: string, nodeId: string): Promise<UserProgressNode | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>(
      'SELECT userId, nodeId, status, current_progress as currentProgress FROM user_progress_nodes WHERE userId = ? AND nodeId = ?',
      [userId, nodeId]
    );
    return row ? (row as UserProgressNode) : null;
  }

  async findAllByUserId(userId: string): Promise<UserProgressNode[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>(
      'SELECT userId, nodeId, status, current_progress as currentProgress FROM user_progress_nodes WHERE userId = ?', 
      [userId]
    );
    return rows as UserProgressNode[];
  }

  async delete(userId: string, nodeId: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM user_progress_nodes WHERE userId = ? AND nodeId = ?', [userId, nodeId]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM user_progress_nodes WHERE userId = ?', [userId]);
  }

  async resetAll(userId: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE user_progress_nodes SET status = "locked", current_progress = 0, sync_status = 1 WHERE userId = ?',
      [userId]
    );
  }
}