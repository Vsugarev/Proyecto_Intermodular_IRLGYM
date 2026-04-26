import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { LibraryExercise } from '../../../domain/entities/LibraryExercise';
import { IExerciseRepository } from '../../../domain/repositoriesInterface/IExerciseRepository';

export class SQLiteExerciseRepository implements IExerciseRepository {

  async save(exercise: LibraryExercise): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT INTO exercises (id, name, category, branch, isCustom) VALUES (?, ?, ?, ?, ?) ' +
      'ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, branch=excluded.branch, isCustom=excluded.isCustom',
      [exercise.id, exercise.name, exercise.category, exercise.branch, exercise.isCustom ? 1 : 0]
    );
  }

  async saveAll(exercises: LibraryExercise[]): Promise<void> {
    const db = await SQLiteClient.getInstance();
    // Usamos una transacción para insertar muchos ejercicios de forma eficiente (Seed)
    await db.withTransactionAsync(async () => {
      for (const ex of exercises) {
        await db.runAsync(
          'INSERT OR REPLACE INTO exercises (id, name, category, branch, isCustom) VALUES (?, ?, ?, ?, ?)',
          [ex.id, ex.name, ex.category, ex.branch, ex.isCustom ? 1 : 0]
        );
      }
    });
  }

  async findAll(): Promise<LibraryExercise[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>('SELECT * FROM exercises');
    return rows.map(row => ({
      ...row,
      isCustom: !!row.isCustom 
    }));
  }

  async findById(id: string): Promise<LibraryExercise | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>('SELECT * FROM exercises WHERE id = ?', [id]);
    if (!row) return null;
    return {
      ...row,
      isCustom: !!row.isCustom
    };
  }

  async findByBranch(branch: string): Promise<LibraryExercise[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>('SELECT * FROM exercises WHERE branch = ?', [branch]);
    return rows.map(row => ({
      ...row,
      isCustom: !!row.isCustom
    }));
  }

  async update(exercise: LibraryExercise): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE exercises SET name = ?, category = ?, branch = ?, isCustom = ? WHERE id = ?',
      [exercise.name, exercise.category, exercise.branch, exercise.isCustom ? 1 : 0, exercise.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
  }
}