import { UserProfile } from "../entities/User";

export interface IUserProfileRepository {
  save(profile: UserProfile): Promise<void>;
  findById(id: string): Promise<UserProfile | null>;
  update(profile: UserProfile): Promise<void>;
  delete(id: string): Promise<void>;
}