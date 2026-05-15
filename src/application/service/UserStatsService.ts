import { UserStatsRepository } from '../../data/repositories/index';
import { UserStats } from '../../domain/entities/User';

export const UserStatsService = {
  async getStats(userId: string) {
    return await UserStatsRepository.findByUserId(userId);
  },

  async updateStats(stats: UserStats) {
    await UserStatsRepository.update(stats);
  }
};