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
  },

  async getExerciseWithStats(exerciseId: string) {
    const exData = await this.getExerciseById(exerciseId);
    if (!exData) return null;

    const logs = await LogRepository.findByExerciseId(exerciseId);
    
    // Traemos info del workout para filtrar (Clean Architecture: lógica de negocio en servicio)
    const logsWithWorkoutInfo = await Promise.all(logs.map(async (log) => {
      const { WorkoutRepository } = require('../../data/repositories/index');
      const workout = await WorkoutRepository.findById(log.workoutId);
      return {
        ...log,
        workoutName: workout?.name || 'Entrenamiento',
        workoutDate: workout?.date,
        isTemplate: workout?.isTemplate,
        status: workout?.status
      };
    }));

    // Filtramos: Solo sesiones finalizadas, NO plantillas (Hevy style)
    const history = logsWithWorkoutInfo
      .filter(l => !l.isTemplate && l.status === 'completed')
      .sort((a, b) => {
        const dateA = a.workoutDate ? new Date(a.workoutDate).getTime() : 0;
        const dateB = b.workoutDate ? new Date(b.workoutDate).getTime() : 0;
        return dateB - dateA;
      });

    // Cálculos de récords
    const maxWeight = history.reduce((max, log) => {
      const logMax = log.series.length > 0 ? Math.max(...log.series.map(s => s.kg || 0)) : 0;
      return Math.max(max, logMax);
    }, 0);

    const estimated1RM = history.reduce((max, log) => {
      const logMax1RM = log.series.length > 0 ? Math.max(...log.series.map(s => {
        if (s.reps > 1) return s.kg * (1 + 0.0333 * s.reps);
        return s.kg;
      })) : 0;
      return Math.max(max, logMax1RM);
    }, 0);

    const maxVolume = history.reduce((max, log) => {
      const logVolume = log.series.reduce((sum, s) => sum + (s.kg * s.reps), 0);
      return Math.max(max, logVolume);
    }, 0);

    return {
      exercise: exData,
      history,
      stats: {
        maxWeight,
        estimated1RM,
        maxVolume,
        totalSeries: history.reduce((acc, log) => acc + log.series.length, 0)
      }
    };
  }
};