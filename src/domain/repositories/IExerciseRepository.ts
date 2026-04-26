import { LibraryExercise } from "../entities/LibraryExercise";

export interface IExerciseRepository {
  // CREATE
  save(exercise: LibraryExercise): Promise<void>;
  saveAll(exercises: LibraryExercise[]): Promise<void>; // Para Seeds

  // READ
  findAll(): Promise<LibraryExercise[]>;
  findById(id: string): Promise<LibraryExercise | null>;
  findByBranch(branch: string): Promise<LibraryExercise[]>;

  // UPDATE
  update(exercise: LibraryExercise): Promise<void>;

  // DELETE
  delete(id: string): Promise<void>;
}