import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { WorkoutLog } from '../../../domain/entities/Workout';
import { ILogRepository } from '../../../domain/repositoriesInterface/ILogRepository';

export class SQLiteLogRepository implements ILogRepository {
  async save(log: WorkoutLog): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO workout_logs (id, workoutId, exerciseId, series_json, note, sync_status) VALUES (?, ?, ?, ?, ?, ?)',
      [log.id, log.workoutId, log.exerciseId, JSON.stringify(log.series), log.note ?? null, 1]
    );
  }

  async findById(id: string): Promise<WorkoutLog | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>('SELECT * FROM workout_logs WHERE id = ?', [id]);
    if (!row) return null;
    return { ...row, series: JSON.parse(row.series_json) };
  }

  async findByWorkoutId(workoutId: string): Promise<WorkoutLog[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>('SELECT * FROM workout_logs WHERE workoutId = ?', [workoutId]);
    return rows.map(row => ({ ...row, series: JSON.parse(row.series_json) }));
  }

  async findByExerciseId(exerciseId: string): Promise<WorkoutLog[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>('SELECT * FROM workout_logs WHERE exerciseId = ?', [exerciseId]);
    return rows.map(row => ({ ...row, series: JSON.parse(row.series_json) }));
  }

  async update(log: WorkoutLog): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE workout_logs SET series_json = ?, note = ?, sync_status = 1 WHERE id = ?',
      [JSON.stringify(log.series), log.note ?? null, log.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM workout_logs WHERE id = ?', [id]);
  }

  async deleteByWorkoutId(workoutId: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM workout_logs WHERE workoutId = ?', [workoutId]);
  }
}