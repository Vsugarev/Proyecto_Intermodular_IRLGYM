import { UserProfileRepository } from '../../data/repositories/index';
import { UserProfile } from '../../domain/entities/User';

export const UserProfileService = {
  async getProfile(uid: string) {
    return await UserProfileRepository.findById(uid);
  },

  async updateProfile(profile: UserProfile) {
    await UserProfileRepository.update(profile);
  },

  async deleteProfile(uid: string) {
    await UserProfileRepository.delete(uid);
  }
};