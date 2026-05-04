import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { LibraryExercise } from '../../../domain/entities/LibraryExercise';
import { IExerciseRepository } from '../../../domain/repositoriesInterface/IExerciseRepository';

export class SQLiteExerciseRepository implements IExerciseRepository {
  async save(ex: LibraryExercise): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO library_exercises (id, name, category, branch, is_custom) VALUES (?, ?, ?, ?, ?)',
      [ex.id, ex.name, ex.category, ex.branch, ex.isCustom ? 1 : 0]
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

  async findAll(): Promise<LibraryExercise[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>('SELECT * FROM library_exercises');
    return rows.map(row => ({ ...row, isCustom: !!row.is_custom }));
  }

  async findById(id: string): Promise<LibraryExercise | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>('SELECT * FROM library_exercises WHERE id = ?', [id]);
    if (!row) return null;
    return { ...row, isCustom: !!row.is_custom };
  }

  async findByBranch(branch: string): Promise<LibraryExercise[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>('SELECT * FROM library_exercises WHERE branch = ?', [branch]);
    return rows.map(row => ({ ...row, isCustom: !!row.is_custom }));
  }

  async update(ex: LibraryExercise): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE library_exercises SET name = ?, category = ?, branch = ?, is_custom = ? WHERE id = ?',
      [ex.name, ex.category, ex.branch, ex.isCustom ? 1 : 0, ex.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM library_exercises WHERE id = ?', [id]);
  }

  async updateFavorite(id: string, isFavorite: number) {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE library_exercises SET is_favorite = ? WHERE id = ?',
      [isFavorite, id]
    );
  }
}