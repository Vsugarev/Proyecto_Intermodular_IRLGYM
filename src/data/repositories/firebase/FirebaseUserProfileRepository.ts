import { db } from '../../../infrastructure/config/firebase'; 
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile } from '../../../domain/entities/User';
import { IUserProfileRepository } from '../../../domain/repositoriesInterface/IUserProfileRepository';

export class FirebaseUserProfileRepository implements IUserProfileRepository {
  private collection = 'user_profiles';

  async save(profile: UserProfile): Promise<void> {
    // Usamos setDoc con ID fijo para que el perfil coincida con el ID de Auth
    await setDoc(doc(db, this.collection, profile.id), profile);
  }

  async findById(id: string): Promise<UserProfile | null> {
    const docSnap = await getDoc(doc(db, this.collection, id));
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  }

  async update(profile: UserProfile): Promise<void> {
    const docRef = doc(db, this.collection, profile.id);
    await updateDoc(docRef, { ...profile });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collection, id));
  }
}