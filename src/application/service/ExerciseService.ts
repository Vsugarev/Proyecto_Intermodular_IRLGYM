import { ExerciseRepository, LogRepository } from '../../data/repositories/index';
import { LibraryExercise } from '../../domain/entities/LibraryExercise';

export const ExerciseService = {
  async getAll(): Promise<LibraryExercise[]> {
    return await ExerciseRepository.findAll(); 
  },

  async searchExercises(query: string, category: string = 'Todos'): Promise<LibraryExercise[]> {
    const all = await this.getAll();
    return all.filter(ex => {
      const matchesQuery = ex.name.toLowerCase().includes(query.toLowerCase());
      
      let matchesCategory = true;
      if (category === 'Favoritos') {
        matchesCategory = ex.isFavorite;
      } else if (category !== 'Todos') {
        matchesCategory = ex.category === category;
      }
      
      return matchesQuery && matchesCategory;
    });
  },

  async getExerciseById(id: string): Promise<LibraryExercise | null> {
    return await ExerciseRepository.findById(id);
  },

  async saveCustomExercise(exercise: LibraryExercise) {
    await ExerciseRepository.save({ ...exercise, isCustom: true });
  },

  async deleteExercise(id: string) {
    // Primero borramos los logs asociados para evitar errores de clave foránea
    await LogRepository.deleteByExerciseId(id);
    // Ahora ya podemos borrar el ejercicio
    await ExerciseRepository.delete(id);
  },

  async toggleFavorite(exerciseId: string, currentStatus: boolean) {
    const newStatus = !currentStatus ? 1 : 0;
    return await ExerciseRepository.updateFavorite(exerciseId, newStatus);
  }
};