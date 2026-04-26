import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { UserProfile } from '../../../domain/entities/User';
import { IUserProfileRepository } from '../../../domain/repositoriesInterface/IUserProfileRepository';

export class SQLiteUserProfileRepository implements IUserProfileRepository {

  async save(profile: UserProfile): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO user_profiles (id, username, avatarUrl) VALUES (?, ?, ?)',
      [profile.id, profile.username, profile.avatarUrl ?? null]
    );
  }

  async findById(id: string): Promise<UserProfile | null> {
    const db = await SQLiteClient.getInstance();
    return await db.getFirstAsync<UserProfile>('SELECT * FROM user_profiles WHERE id = ?', [id]);
  }

  async update(profile: UserProfile): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE user_profiles SET username = ?, avatarUrl = ? WHERE id = ?',
      [profile.username, profile.avatarUrl ?? null, profile.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM user_profiles WHERE id = ?', [id]);
  }
}