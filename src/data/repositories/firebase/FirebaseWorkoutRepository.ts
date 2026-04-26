import { db } from '../../../infrastructure/config/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Workout } from '../../../domain/entities/Workout';
import { IWorkoutRepository } from '../../../domain/repositoriesInterface/IWorkoutRepository';

export class FirebaseWorkoutRepository implements IWorkoutRepository {
  private colName = 'workouts';

  async save(workout: Workout): Promise<void> {
    await setDoc(doc(db, this.colName, workout.id), workout);
  }

  async findById(id: string): Promise<Workout | null> {
    const snap = await getDoc(doc(db, this.colName, id));
    return snap.exists() ? (snap.data() as Workout) : null;
  }

  async findAllByUserId(userId: string): Promise<Workout[]> {
    const q = query(collection(db, this.colName), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Workout);
  }

  async findInProgressByUserId(userId: string): Promise<Workout | null> {
    const q = query(
      collection(db, this.colName), 
      where('userId', '==', userId), 
      where('status', '==', 'in_progress')
    );
    const snap = await getDocs(q);
    return snap.empty ? null : (snap.docs[0].data() as Workout);
  }

  async update(workout: Workout): Promise<void> {
    await updateDoc(doc(db, this.colName, workout.id), { ...workout });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.colName, id));
  }
}