import { WorkoutRepository } from '../../data/repositories/index';
import { auth } from '../../infrastructure/config/firebase';

export const RoutineService = {

  async saveRoutine(name: string, id?: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("Sesión no válida");

    const routineData = {
      id: id || Date.now().toString(), 
      name: name,
      userId: user.uid,
      date: new Date().toISOString(),
      status: 'in_progress',
      sync_status: 1
    };

    await WorkoutRepository.save(routineData);
    return routineData;
  },


  async deleteRoutine(id: string) {
    if (!id) throw new Error("ID no válido");
    return await WorkoutRepository.delete(id);
  }
};