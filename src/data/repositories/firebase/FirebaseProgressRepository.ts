import { db } from '../../../infrastructure/config/firebase';
import { doc, getDoc, getDocs, collection, query, where, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { UserProgressNode } from '../../../domain/entities/SkillNode';
import { IProgressRepository } from '../../../domain/repositoriesInterface/IProgressRepository';

export class FirebaseProgressRepository implements IProgressRepository {
  private col = 'user_progress';

  private getDocId(userId: string, nodeId: string): string {
    return `${userId}_${nodeId}`;
  }

  async save(progress: UserProgressNode): Promise<void> {
    const id = this.getDocId(progress.userId, progress.nodeId);
    await setDoc(doc(db, this.col, id), progress);
  }

  async find(userId: string, nodeId: string): Promise<UserProgressNode | null> {
    const id = this.getDocId(userId, nodeId);
    const snap = await getDoc(doc(db, this.col, id));
    return snap.exists() ? (snap.data() as UserProgressNode) : null;
  }

  async findAllByUserId(userId: string): Promise<UserProgressNode[]> {
    const q = query(collection(db, this.col), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProgressNode);
  }

  async delete(userId: string, nodeId: string): Promise<void> {
    const id = this.getDocId(userId, nodeId);
    await deleteDoc(doc(db, this.col, id));
  }

  async resetAll(userId: string): Promise<void> {
    const q = query(collection(db, this.col), where('userId', '==', userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}