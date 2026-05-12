import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { Workout } from '../../../domain/entities/Workout';
import { IWorkoutRepository } from '../../../domain/repositoriesInterface/IWorkoutRepository';

export class SQLiteWorkoutRepository implements IWorkoutRepository {
  async save(workout: Workout): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO workouts (id, userId, name, date, status, is_template, parent_id, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [workout.id, workout.userId, workout.name, workout.date, workout.status, workout.isTemplate ? 1 : 0, workout.parentId || null, 1]
    );
  }

  async findById(id: string): Promise<Workout | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>('SELECT * FROM workouts WHERE id = ?', [id]);
    return row ? { ...row, isTemplate: !!row.is_template, parentId: row.parent_id } : null;
  }

  async findAllByUserId(userId: string): Promise<Workout[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>('SELECT * FROM workouts WHERE userId = ? ORDER BY date DESC', [userId]);
    return rows.map(row => ({ ...row, isTemplate: !!row.is_template, parentId: row.parent_id }));
  }

  async findInProgressByUserId(userId: string): Promise<Workout | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM workouts WHERE userId = ? AND status = ?', 
      [userId, 'in_progress']
    );
    return row ? { ...row, isTemplate: !!row.is_template, parentId: row.parent_id } : null;
  }

  async update(workout: Workout): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE workouts SET name = ?, date = ?, status = ?, is_template = ?, parent_id = ?, sync_status = 1 WHERE id = ?',
      [workout.name, workout.date, workout.status, workout.isTemplate ? 1 : 0, workout.parentId || null, workout.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM workouts WHERE userId = ?', [userId]);
  }
async markAsSynced(id: string): Promise<void> {
  const db = await SQLiteClient.getInstance();
  try {
    await db.runAsync(
      'UPDATE workouts SET sync_status = 0 WHERE id = ?',
      [id]
    );
    console.log(`Workout ${id} marcado como sincronizado.`);
  } catch (error) {
    console.error("Error al marcar como sincronizado:", error);
    throw error;
  }
}
}