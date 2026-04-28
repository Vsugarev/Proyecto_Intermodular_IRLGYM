import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { UserProfile } from '../../../domain/entities/User';
import { IUserProfileRepository } from '../../../domain/repositoriesInterface/IUserProfileRepository';

export class SQLiteUserProfileRepository implements IUserProfileRepository {
  async save(profile: UserProfile): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO profiles (id, username, avatar_url, sync_status) VALUES (?, ?, ?, ?)',
      [profile.id, profile.username, profile.avatarUrl ?? null, 1]
    );
  }

  async findById(id: string): Promise<UserProfile | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>('SELECT id, username, avatar_url as avatarUrl FROM profiles WHERE id = ?', [id]);
    return row || null;
  }

  async update(profile: UserProfile): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE profiles SET username = ?, avatar_url = ?, sync_status = 1 WHERE id = ?',
      [profile.username, profile.avatarUrl ?? null, profile.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM profiles WHERE id = ?', [id]);
  }
}