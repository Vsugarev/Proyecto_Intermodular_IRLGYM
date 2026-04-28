import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { Workout } from '../../../domain/entities/Workout';
import { IWorkoutRepository } from '../../../domain/repositoriesInterface/IWorkoutRepository';

export class SQLiteWorkoutRepository implements IWorkoutRepository {
  async save(workout: Workout): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO workouts (id, userId, name, date, status, sync_status) VALUES (?, ?, ?, ?, ?, ?)',
      [workout.id, workout.userId, workout.name, workout.date, workout.status, 1]
    );
  }

  async findById(id: string): Promise<Workout | null> {
    const db = await SQLiteClient.getInstance();
    return await db.getFirstAsync<Workout>('SELECT * FROM workouts WHERE id = ?', [id]);
  }

  async findAllByUserId(userId: string): Promise<Workout[]> {
    const db = await SQLiteClient.getInstance();
    return await db.getAllAsync<Workout>('SELECT * FROM workouts WHERE userId = ? ORDER BY date DESC', [userId]);
  }

  async findInProgressByUserId(userId: string): Promise<Workout | null> {
    const db = await SQLiteClient.getInstance();
    return await db.getFirstAsync<Workout>(
      'SELECT * FROM workouts WHERE userId = ? AND status = ?', 
      [userId, 'in_progress']
    );
  }

  async update(workout: Workout): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE workouts SET name = ?, date = ?, status = ?, sync_status = 1 WHERE id = ?',
      [workout.name, workout.date, workout.status, workout.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
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