import { WorkoutLog } from "../entities/Workout";

export interface ILogRepository {
  // CREATE
  save(log: WorkoutLog): Promise<void>;
  
  // READ
  findById(id: string): Promise<WorkoutLog | null>;
  findByWorkoutId(workoutId: string): Promise<WorkoutLog[]>;
  // Útil para ver el progreso histórico de un ejercicio específico
  findByExerciseId(exerciseId: string): Promise<WorkoutLog[]>;
  
  // UPDATE
  update(log: WorkoutLog): Promise<void>;
  
  // DELETE
  delete(id: string): Promise<void>;
  deleteByWorkoutId(workoutId: string): Promise<void>;
}