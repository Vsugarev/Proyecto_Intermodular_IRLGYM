import { UserStatsRepository, SkillRepository, ProgressRepository } from '../../data/repositories/index';
import { UserStats } from '../../domain/entities/User';
import { SkillNode, UserProgressNode } from '../../domain/entities/SkillNode';

export const SkillService = {
  async getUserStats(userId: string): Promise<UserStats | null> {
    return await UserStatsRepository.findByUserId(userId);
  },

  async addExperience(userId: string, xpAmount: number): Promise<void> {
    let stats = await UserStatsRepository.findByUserId(userId);
    if (!stats) {
      stats = { userId, level: 1, currentXp: 0, streakCount: 0 };
    }
    
    const now = new Date();
    const startOfCurrentWeek = this.getStartOfWeek(now);
    
    if (stats.lastWorkoutDate) {
      const lastWorkout = new Date(stats.lastWorkoutDate);
      const startOfLastWeek = this.getStartOfWeek(lastWorkout);
      
      const diffTime = startOfCurrentWeek.getTime() - startOfLastWeek.getTime();
      const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));

      if (diffWeeks === 1) {
        stats.streakCount += 1;
      } else if (diffWeeks > 1) {
        stats.streakCount = 1;
      }
    } else {
      stats.streakCount = 1;
    }

    stats.lastWorkoutDate = now.toISOString();
    stats.currentXp += xpAmount;
    
    let nextLevelBaseXP = this.getXPForLevel(stats.level + 1);
    while (stats.currentXp >= nextLevelBaseXP) {
      stats.level += 1;
      nextLevelBaseXP = this.getXPForLevel(stats.level + 1);
    }
    
    await UserStatsRepository.save(stats);
  },

  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  },

  calculateLevelProgress(xp: number, level: number): number {
    const currentLevelBaseXP = this.getXPForLevel(level);
    const nextLevelBaseXP = this.getXPForLevel(level + 1);
    const xpInCurrentLevel = xp - currentLevelBaseXP;
    const xpRequiredForNext = nextLevelBaseXP - currentLevelBaseXP;
    
    return Math.min(Math.max(xpInCurrentLevel / xpRequiredForNext, 0), 1);
  },

  getXPForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += i * 100;
    }
    return total;
  },

  async getSkillTree(userId: string) {
    await this.seedSkillsIfEmpty();

    const allNodes = await SkillRepository.findAll();
    const userProgress = await ProgressRepository.findAllByUserId(userId);

    return allNodes.map(node => {
      const progress = userProgress.find(p => p.nodeId === node.id);
      let status: 'locked' | 'available' | 'completed' = 'locked';
      
      if (progress && progress.status === 'completed') {
        status = 'completed';
      } else {
        const isFirstNode = !node.prevNodeId;
        const prevNodeCompleted = node.prevNodeId ? 
          userProgress.find(p => p.nodeId === node.prevNodeId)?.status === 'completed' : false;

        if (isFirstNode || prevNodeCompleted) {
          status = 'available';
        }
      }

      return { ...node, status };
    });
  },

  async unlockSkill(userId: string, skillId: string): Promise<{ effect: string } | void> {
    const userProgress = await ProgressRepository.findAllByUserId(userId);
    const existingProgress = userProgress.find(p => p.nodeId === skillId);
    
    if (existingProgress && existingProgress.status === 'completed') return;

    const allNodes = await SkillRepository.findAll();
    const node = allNodes.find(n => n.id === skillId);

    await ProgressRepository.save({
      userId,
      nodeId: skillId,
      status: 'completed',
      currentProgress: 100
    });

    if (node && node.xpReward) {
      await this.addExperience(userId, node.xpReward);
    }

    let effectMessage = '';
    const { WorkoutService } = require('./WorkoutService');
    const { LogService } = require('./LogService');

    const createTemplate = async (name: string, exerciseIds: string[]) => {
      const template = await WorkoutService.createEmptyTemplate(userId, name);
      for (const exId of exerciseIds) {
        await LogService.createLog(template.id, exId, [
          { kg: 0, reps: 0, type: 'R', rpe: 0 },
          { kg: 0, reps: 0, type: 'R', rpe: 0 },
          { kg: 0, reps: 0, type: 'R', rpe: 0 }
        ]);
      }
    };

    switch (skillId) {
      case 'sk_1':
        await createTemplate('Rutina: Fundamentos', ['ex_1', 'ex_2', 'ex_10']);
        effectMessage = 'Nueva rutina desbloqueada: Fundamentos';
        break;
      case 'sk_3':
        await createTemplate('Rutina: Powerlifting Base', ['ex_2', 'ex_1', 'ex_3', 'ex_4']);
        effectMessage = 'Nueva rutina desbloqueada: Powerlifting Base';
        break;
      case 'sk_4':
        await createTemplate('Rutina: Calistenia Inicial', ['ex_5', 'ex_9', 'ex_26']);
        effectMessage = 'Nueva rutina desbloqueada: Calistenia Inicial';
        break;
      case 'sk_8':
        await createTemplate('Rutina: Mastery Muscle-up', ['ex_31', 'ex_5', 'ex_26']);
        effectMessage = 'Rutina desbloqueada: Mastery Muscle-up';
        break;
      case 'sk_10':
        await createTemplate('Rutina: Hipertrofia Pierna', ['ex_2', 'ex_14', 'ex_15', 'ex_16']);
        effectMessage = 'Rutina desbloqueada: Hipertrofia Pierna';
        break;
      case 'sk_11':
        effectMessage = 'Consejo Pro: Enfócate en la retracción escapular en el press de banca.';
        break;
      case 'sk_16':
        await createTemplate('Rutina: ATLETA COMPLETO', ['ex_3', 'ex_31', 'ex_1', 'ex_2', 'ex_29']);
        effectMessage = '¡Has desbloqueado la rutina final de Atleta Completo!';
        break;
      case 'sk_17':
        effectMessage = 'Nutrición: Para ganar músculo necesitas un superávit calórico de 200-300 kcal.';
        break;
      case 'sk_18':
        effectMessage = 'Nutrición: Para perder grasa mantén un déficit moderado y alta proteína.';
        break;
      default:
        effectMessage = 'Has ganado experiencia y mejorado tus habilidades.';
    }

    return { effect: effectMessage };
  },

  async seedSkillsIfEmpty() {
    const initialSkills: SkillNode[] = [
      // Rama Base / Fuerza
      { id: 'sk_1', title: 'Fundamentos de Fuerza', branch: 'base', requirementsJson: '{"level": 1}', prevNodeId: null, xpReward: 50 },
      { id: 'sk_2', title: 'Técnica de Sentadilla', branch: 'base', requirementsJson: '{"level": 2}', prevNodeId: 'sk_1', xpReward: 100 },
      { id: 'sk_3', title: 'Powerlifting Base', branch: 'base', requirementsJson: '{"level": 5}', prevNodeId: 'sk_2', xpReward: 200 },
      { id: 'sk_11', title: 'Maestro del Press', branch: 'base', requirementsJson: '{"level": 8}', prevNodeId: 'sk_3', xpReward: 250 },
      { id: 'sk_12', title: 'Rey del Peso Muerto', branch: 'base', requirementsJson: '{"level": 10}', prevNodeId: 'sk_11', xpReward: 300 },
      { id: 'sk_15', title: 'Guerrero de Hierro', branch: 'base', requirementsJson: '{"level": 15}', prevNodeId: 'sk_12', xpReward: 500 },
      
      // Rama Calistenia
      { id: 'sk_4', title: 'Calistenia Inicial', branch: 'calisthenics', requirementsJson: '{"level": 1}', prevNodeId: null, xpReward: 50 },
      { id: 'sk_5', title: 'Dominio de Pull-up', branch: 'calisthenics', requirementsJson: '{"level": 3}', prevNodeId: 'sk_4', xpReward: 100 },
      { id: 'sk_6', title: 'Fondos Explosivos', branch: 'calisthenics', requirementsJson: '{"level": 5}', prevNodeId: 'sk_5', xpReward: 150 },
      { id: 'sk_7', title: 'Camino al Muscle-up', branch: 'calisthenics', requirementsJson: '{"level": 8}', prevNodeId: 'sk_6', xpReward: 200 },
      { id: 'sk_8', title: 'Maestría del Muscle-up', branch: 'calisthenics', requirementsJson: '{"level": 12}', prevNodeId: 'sk_7', xpReward: 400 },
      { id: 'sk_16', title: 'Atleta Completo', branch: 'calisthenics', requirementsJson: '{"level": 20}', prevNodeId: 'sk_8', xpReward: 1000 },
      
      // Rama Hipertrofia
      { id: 'sk_9', title: 'Hipertrofia: Torso', branch: 'hypertrophy', requirementsJson: '{"level": 4}', prevNodeId: null, xpReward: 150 },
      { id: 'sk_10', title: 'Hipertrofia: Pierna', branch: 'hypertrophy', requirementsJson: '{"level": 4}', prevNodeId: null, xpReward: 150 },
      { id: 'sk_13', title: 'Conexión Mente-Músculo', branch: 'hypertrophy', requirementsJson: '{"level": 7}', prevNodeId: 'sk_9', xpReward: 200 },
      { id: 'sk_14', title: 'Definición Muscular', branch: 'hypertrophy', requirementsJson: '{"level": 10}', prevNodeId: 'sk_13', xpReward: 300 },
      
      // Rama Nutrición / Conocimiento
      { id: 'sk_17', title: 'Superávit Calórico', branch: 'base', requirementsJson: '{"level": 5}', prevNodeId: 'sk_2', xpReward: 100 },
      { id: 'sk_18', title: 'Déficit Calórico', branch: 'base', requirementsJson: '{"level": 5}', prevNodeId: 'sk_2', xpReward: 100 },
      { id: 'sk_19', title: 'Suplementación Básica', branch: 'base', requirementsJson: '{"level": 10}', prevNodeId: 'sk_17', xpReward: 200 },
      { id: 'sk_20', title: 'Mentalidad de Acero', branch: 'base', requirementsJson: '{"level": 25}', prevNodeId: 'sk_15', xpReward: 2000 },
    ];

    const existing = await SkillRepository.findAll();
    if (existing.length < initialSkills.length) {
      await SkillRepository.saveAll(initialSkills);
    }
  }
};