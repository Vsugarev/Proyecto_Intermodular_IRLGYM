import { UserStatsRepository } from '../../data/repositories/index';
import { UserStats } from '../../domain/entities/User';

export const SkillService = {
  async getUserStats(userId: string): Promise<UserStats | null> {
    return await UserStatsRepository.findByUserId(userId);
  },

  // Calculamos el progreso porcentual para el siguiente nivel
  // Por simplicidad FP: cada nivel requiere (nivel * 100) XP adicionales
  calculateLevelProgress(xp: number, level: number): number {
    const currentLevelBaseXP = this.getXPForLevel(level);
    const nextLevelBaseXP = this.getXPForLevel(level + 1);
    const xpInCurrentLevel = xp - currentLevelBaseXP;
    const xpRequiredForNext = nextLevelBaseXP - currentLevelBaseXP;
    
    return Math.min(Math.max(xpInCurrentLevel / xpRequiredForNext, 0), 1);
  },

  getXPForLevel(level: number): number {
    // Ejemplo simple: 0, 100, 300, 600, 1000... (Aritmética simple)
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += i * 100;
    }
    return total;
  }
};