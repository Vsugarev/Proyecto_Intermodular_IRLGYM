import { ProgressRepository } from '../../data/repositories/index';
import { UserProgressNode } from '../../domain/entities/SkillNode';

export const ProgressService = {
  async getUserProgress(userId: string) {
    return await ProgressRepository.findAllByUserId(userId);
  },

  async saveProgress(progress: UserProgressNode) {
    await ProgressRepository.save(progress);
  },

  async deleteProgress(userId: string, nodeId: string) {
    await ProgressRepository.delete(userId, nodeId);
  }
};