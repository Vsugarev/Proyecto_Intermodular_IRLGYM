import { ExerciseRepository } from '../../data/repositories/index';
import { LibraryExercise } from '../../domain/entities/LibraryExercise';

export const ExerciseService = {
  async getAll() {
    return await ExerciseRepository.findAll(); 
  },

  async searchExercises(query: string, category?: string) {
    const all = await this.getAll();
    return all.filter(ex => {
      const matchesQuery = ex.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category ? ex.category === category : true;
      return matchesQuery && matchesCategory;
    });
  },

  async getExerciseById(id: string) {
    return await ExerciseRepository.findById(id);
  },

  async saveCustomExercise(exercise: LibraryExercise) {
    await ExerciseRepository.save({ ...exercise, isCustom: true });
  },

  async deleteExercise(id: string) {
    await ExerciseRepository.delete(id);
  },

  async toggleFavorite(exerciseId: string, currentStatus: boolean) {
    const newStatus = !currentStatus ? 1 : 0;
    return await ExerciseRepository.updateFavorite(exerciseId, newStatus);
  }
};