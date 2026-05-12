import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { UserProfile } from '../../../domain/entities/User';
import { IUserProfileRepository } from '../../../domain/repositoriesInterface/IUserProfileRepository';

export class SQLiteUserProfileRepository implements IUserProfileRepository {
  async save(profile: UserProfile): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      `INSERT INTO profiles (id, username, email, avatar_url, weight, measurement_units, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         username=excluded.username,
         email=excluded.email,
         avatar_url=excluded.avatar_url,
         weight=excluded.weight,
         measurement_units=excluded.measurement_units,
         sync_status=1`,
      [profile.id, profile.username, profile.email, profile.avatarUrl ?? null, profile.weight ?? null, profile.measurementUnits]
    );
  }

  async findById(id: string): Promise<UserProfile | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>('SELECT * FROM profiles WHERE id = ?', [id]);
    if (!row) return null;
    return {
      ...row,
      avatarUrl: row.avatar_url,
      measurementUnits: row.measurement_units
    };
  }

  async update(profile: UserProfile): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE profiles SET username = ?, email = ?, avatar_url = ?, weight = ?, measurement_units = ?, sync_status = 1 WHERE id = ?',
      [profile.username, profile.email, profile.avatarUrl ?? null, profile.weight ?? null, profile.measurementUnits, profile.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM profiles WHERE id = ?', [id]);
  }
}