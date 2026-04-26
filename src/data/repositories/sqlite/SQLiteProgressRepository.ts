import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { UserProgressNode } from '../../../domain/entities/SkillNode';
import { IProgressRepository } from '../../../domain/repositoriesInterface/IProgressRepository';

export class SQLiteProgressRepository implements IProgressRepository {

  async saveProgress(progress: UserProgressNode): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO user_progress (userId, nodeId, status, currentProgress) VALUES (?, ?, ?, ?)',
      [progress.userId, progress.nodeId, progress.status, progress.currentProgress]
    );
  }

  async findProgress(userId: string, nodeId: string): Promise<UserProgressNode | null> {
    const db = await SQLiteClient.getInstance();
    return await db.getFirstAsync<UserProgressNode>(
      'SELECT * FROM user_progress WHERE userId = ? AND nodeId = ?',
      [userId, nodeId]
    );
  }

  async findAllPlayerProgress(userId: string): Promise<UserProgressNode[]> {
    const db = await SQLiteClient.getInstance();
    return await db.getAllAsync<UserProgressNode>('SELECT * FROM user_progress WHERE userId = ?', [userId]);
  }

  async deleteProgress(userId: string, nodeId: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM user_progress WHERE userId = ? AND nodeId = ?', [userId, nodeId]);
  }

async resetAllProgress(userId: string): Promise<void> {
  const db = await SQLiteClient.getInstance();
  await db.runAsync('DELETE FROM user_progress WHERE userId = ?', [userId]);
}
}