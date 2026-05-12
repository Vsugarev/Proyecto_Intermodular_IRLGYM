import { WorkoutLog } from "../entities/Workout";

export interface ILogRepository {
  save(log: WorkoutLog): Promise<void>;
  findById(id: string): Promise<WorkoutLog | null>;
  findByWorkoutId(workoutId: string): Promise<WorkoutLog[]>;
  findByExerciseId(exerciseId: string): Promise<WorkoutLog[]>;
  update(log: WorkoutLog): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByWorkoutId(workoutId: string): Promise<void>;
  deleteByExerciseId(exerciseId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}