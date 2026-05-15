import { db } from '../../../infrastructure/config/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UserStats } from '../../../domain/entities/User';
import { IUserStatsRepository } from '../../../domain/repositoriesInterface/IUserStatsRepository';

export class FirebaseUserStatsRepository implements IUserStatsRepository {
  private col = 'user_stats';

  async save(stats: UserStats): Promise<void> {
    await setDoc(doc(db, this.col, stats.userId), stats);
  }

  async findByUserId(userId: string): Promise<UserStats | null> {
    const snap = await getDoc(doc(db, this.col, userId));
    return snap.exists() ? (snap.data() as UserStats) : null;
  }

  async update(stats: UserStats): Promise<void> {
    await setDoc(doc(db, this.col, stats.userId), stats, { merge: true });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await deleteDoc(doc(db, this.col, userId));
  }
}