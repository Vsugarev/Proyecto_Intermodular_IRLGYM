import { UserStatsRepository } from '../../data/repositories/index';
import { UserStats } from '../../domain/entities/User';

export const UserStatsService = {
  async getStats(userId: string) {
    return await UserStatsRepository.findByUserId(userId);
  },

  async updateStats(stats: UserStats) {
    await UserStatsRepository.update(stats);
  },

  async addExperience(userId: string, xp: number) {
    const stats: UserStats = await UserStatsRepository.findByUserId(userId);
    if (!stats) return;

    stats.currentXp += xp;
    while (stats.currentXp >= 1000) {
      stats.currentXp -= 1000;
      stats.level += 1;
    }
    stats.lastWorkoutDate = new Date().toISOString();

    await UserStatsRepository.update(stats);
  }
};