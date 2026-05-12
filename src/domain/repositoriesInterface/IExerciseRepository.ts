import { LibraryExercise } from "../entities/LibraryExercise";

export interface IExerciseRepository {
  save(exercise: LibraryExercise): Promise<void>;
  saveAll(exercises: LibraryExercise[]): Promise<void>;
  findAll(): Promise<LibraryExercise[]>;
  findById(id: string): Promise<LibraryExercise | null>;
  findByBranch(branch: string): Promise<LibraryExercise[]>;
  update(exercise: LibraryExercise): Promise<void>;
  delete(id: string): Promise<void>;
  updateFavorite(id: string, isFavorite: number): Promise<void>;
  clearUserData(): Promise<void>;
}