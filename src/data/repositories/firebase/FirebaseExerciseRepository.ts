import { db } from '../../../infrastructure/config/firebase';
import { doc, getDoc, getDocs, collection, query, where, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { IExerciseRepository } from '../../../domain/repositoriesInterface/IExerciseRepository';
import { LibraryExercise } from '../../../domain/entities/LibraryExercise';

export class FirebaseExerciseRepository implements IExerciseRepository {
  private col = 'exercises';

  async save(exercise: LibraryExercise): Promise<void> {
    await setDoc(doc(db, this.col, exercise.id), exercise);
  }

  async saveAll(exercises: LibraryExercise[]): Promise<void> {
    const batch = writeBatch(db);
    exercises.forEach(ex => batch.set(doc(db, this.col, ex.id), ex));
    await batch.commit();
  }

  async findAll(): Promise<LibraryExercise[]> {
    const snap = await getDocs(collection(db, this.col));
    return snap.docs.map(d => d.data() as LibraryExercise);
  }

  async findById(id: string): Promise<LibraryExercise | null> {
    const snap = await getDoc(doc(db, this.col, id));
    return snap.exists() ? (snap.data() as LibraryExercise) : null;
  }

  async findByBranch(branch: string): Promise<LibraryExercise[]> {
    const q = query(collection(db, this.col), where('branch', '==', branch));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as LibraryExercise);
  }

  async update(exercise: LibraryExercise): Promise<void> {
    await setDoc(doc(db, this.col, exercise.id), exercise, { merge: true });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.col, id));
  }
}