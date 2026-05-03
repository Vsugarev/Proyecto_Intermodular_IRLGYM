import { ExerciseRepository } from '../../data/repositories/index';
import { LibraryExercise } from '../../domain/entities/LibraryExercise';

export const ExerciseService = {
  async getAll() {
    return await ExerciseRepository.findAll(); 
  },

  async saveCustomExercise(exercise: LibraryExercise) {
    await ExerciseRepository.save({ ...exercise, isCustom: true });
  },

  async deleteExercise(id: string) {
    await ExerciseRepository.delete(id);
  }
};