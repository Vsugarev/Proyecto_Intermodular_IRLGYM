import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { LibraryExercise } from '../../../domain/entities/LibraryExercise';
import { IExerciseRepository } from '../../../domain/repositoriesInterface/IExerciseRepository';

export class SQLiteExerciseRepository implements IExerciseRepository {
  async save(ex: LibraryExercise): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO library_exercises (id, name, category, branch, muscle_group, description, image_url, is_custom, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ex.id, ex.name, ex.category, ex.branch, ex.muscleGroup ?? null, ex.description ?? null, ex.imageUrl ?? null, ex.isCustom ? 1 : 0, ex.isFavorite ? 1 : 0]
    );
  }

  async saveAll(exercises: LibraryExercise[]): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.withTransactionAsync(async () => {
      for (const ex of exercises) {
        await this.save(ex);
      }
    });
  }

  private mapRow(row: any): LibraryExercise {
    return {
      ...row,
      muscleGroup: row.muscle_group,
      imageUrl: row.image_url,
      isCustom: !!row.is_custom,
      isFavorite: !!row.is_favorite
    };
  }

  async findAll(): Promise<LibraryExercise[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>('SELECT * FROM library_exercises');
    return rows.map(row => this.mapRow(row));
  }

  async findById(id: string): Promise<LibraryExercise | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>('SELECT * FROM library_exercises WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapRow(row);
  }

  async findByBranch(branch: string): Promise<LibraryExercise[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>('SELECT * FROM library_exercises WHERE branch = ?', [branch]);
    return rows.map(row => this.mapRow(row));
  }

  async update(ex: LibraryExercise): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE library_exercises SET name = ?, category = ?, branch = ?, muscle_group = ?, description = ?, image_url = ?, is_custom = ?, is_favorite = ? WHERE id = ?',
      [ex.name, ex.category, ex.branch, ex.muscleGroup ?? null, ex.description ?? null, ex.imageUrl ?? null, ex.isCustom ? 1 : 0, ex.isFavorite ? 1 : 0, ex.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM library_exercises WHERE id = ?', [id]);
  }

  async updateFavorite(id: string, isFavorite: number): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE library_exercises SET is_favorite = ? WHERE id = ?',
      [isFavorite, id]
    );
  }

  async clearUserData(): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('UPDATE library_exercises SET is_favorite = 0');
    await db.runAsync('DELETE FROM library_exercises WHERE is_custom = 1');
  }
}