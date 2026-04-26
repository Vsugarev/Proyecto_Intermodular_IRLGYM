import { db } from '../../../infrastructure/config/firebase';
import { doc, getDoc, getDocs, collection, query, where, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { SkillNode } from '../../../domain/entities/SkillNode';
import { TrainingBranch } from '../../../domain/entities/LibraryExercise';
import { ISkillRepository } from '../../../domain/repositoriesInterface/ISkillRepository';

export class FirebaseSkillRepository implements ISkillRepository {
  private col = 'skill_nodes';

  async save(node: SkillNode): Promise<void> {
    await setDoc(doc(db, this.col, node.id), node);
  }

  async saveAll(nodes: SkillNode[]): Promise<void> {
    const batch = writeBatch(db);
    nodes.forEach(node => batch.set(doc(db, this.col, node.id), node));
    await batch.commit();
  }

  async findById(id: string): Promise<SkillNode | null> {
    const snap = await getDoc(doc(db, this.col, id));
    return snap.exists() ? (snap.data() as SkillNode) : null;
  }

  async findAll(): Promise<SkillNode[]> {
    const snap = await getDocs(collection(db, this.col));
    return snap.docs.map(d => d.data() as SkillNode);
  }

  async findByBranch(branch: TrainingBranch): Promise<SkillNode[]> {
    const q = query(collection(db, this.col), where('branch', '==', branch));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SkillNode);
  }

  async update(node: SkillNode): Promise<void> {
    await setDoc(doc(db, this.col, node.id), node, { merge: true });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.col, id));
  }

  async deleteAll(): Promise<void> {
    const snap = await getDocs(collection(db, this.col));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}