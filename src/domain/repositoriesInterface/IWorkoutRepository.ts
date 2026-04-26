import { Workout } from "../entities/Workout";

export interface IWorkoutRepository {
  // CREATE
  save(workout: Workout): Promise<void>;
  
  // READ
  findById(id: string): Promise<Workout | null>;
  findAllByUserId(userId: string): Promise<Workout[]>;
  // Recupera el entrenamiento que no ha sido finalizado
  findInProgressByUserId(userId: string): Promise<Workout | null>;
  
  // UPDATE
  update(workout: Workout): Promise<void>;
  
  // DELETE
  delete(id: string): Promise<void>;
}