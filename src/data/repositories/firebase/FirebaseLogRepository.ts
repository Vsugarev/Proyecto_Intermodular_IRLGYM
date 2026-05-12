import { db } from '../../../infrastructure/config/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { ILogRepository } from '../../../domain/repositoriesInterface/ILogRepository';
import { WorkoutLog } from '../../../domain/entities/Workout';

export class FirebaseLogRepository implements ILogRepository {
  private colName = 'workout_logs';

  async save(log: WorkoutLog): Promise<void> {
    await setDoc(doc(db, this.colName, log.id), log);
  }

  async findById(id: string): Promise<WorkoutLog | null> {
    const snap = await getDoc(doc(db, this.colName, id));
    return snap.exists() ? (snap.data() as WorkoutLog) : null;
  }

  async findByWorkoutId(workoutId: string): Promise<WorkoutLog[]> {
    const q = query(collection(db, this.colName), where('workoutId', '==', workoutId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as WorkoutLog);
  }

  async findByExerciseId(exerciseId: string): Promise<WorkoutLog[]> {
    const q = query(collection(db, this.colName), where('exerciseId', '==', exerciseId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as WorkoutLog);
  }

  async update(log: WorkoutLog): Promise<void> {
    await updateDoc(doc(db, this.colName, log.id), { ...log });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.colName, id));
  }

  async deleteByWorkoutId(workoutId: string): Promise<void> {
    const q = query(collection(db, this.colName), where('workoutId', '==', workoutId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteByExerciseId(exerciseId: string): Promise<void> {
    const q = query(collection(db, this.colName), where('exerciseId', '==', exerciseId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteByUserId(userId: string): Promise<void> {
    // Primero necesitamos los IDs de los workouts del usuario
    const qWorkouts = query(collection(db, 'workouts'), where('userId', '==', userId));
    const workoutSnaps = await getDocs(qWorkouts);
    const workoutIds = workoutSnaps.docs.map(d => d.id);

    if (workoutIds.length === 0) return;

    // Firebase tiene un límite de 10 en 'in'. Si hay más, lo hacemos por lotes o iteramos
    for (let i = 0; i < workoutIds.length; i += 10) {
      const chunk = workoutIds.slice(i, i + 10);
      const qLogs = query(collection(db, this.colName), where('workoutId', 'in', chunk));
      const logSnaps = await getDocs(qLogs);
      const batch = writeBatch(db);
      logSnaps.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }
}