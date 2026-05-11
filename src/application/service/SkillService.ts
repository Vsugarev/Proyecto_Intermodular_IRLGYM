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
    
    stats.currentXp += xpAmount;
    
    // Verificamos si hay subida de nivel
    let nextLevelBaseXP = this.getXPForLevel(stats.level + 1);
    while (stats.currentXp >= nextLevelBaseXP) {
      stats.level += 1;
      nextLevelBaseXP = this.getXPForLevel(stats.level + 1);
    }
    
    await UserStatsRepository.save(stats);
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
  },

  async getSkillTree(userId: string) {
    await this.seedSkillsIfEmpty(); // Aseguramos que haya datos

    const allNodes = await SkillRepository.findAll();
    const userProgress = await ProgressRepository.findAllByUserId(userId);

    return allNodes.map(node => {
      const progress = userProgress.find(p => p.nodeId === node.id);
      
      let status: 'locked' | 'available' | 'completed' = 'locked';
      
      if (progress && progress.status === 'completed') {
        status = 'completed';
      } else {
        // Lógica de disponibilidad
        const isFirstNode = !node.prevNodeId;
        const prevNodeCompleted = node.prevNodeId ? 
          userProgress.find(p => p.nodeId === node.prevNodeId)?.status === 'completed' : false;

        if (isFirstNode || prevNodeCompleted) {
          status = 'available';
        }
      }

      return {
        ...node,
        status
      };
    });
  },

  async unlockSkill(userId: string, skillId: string): Promise<{ effect: string } | void> {
    // Verificamos si ya está desbloqueada
    const userProgress = await ProgressRepository.findAllByUserId(userId);
    const existingProgress = userProgress.find(p => p.nodeId === skillId);
    
    if (existingProgress && existingProgress.status === 'completed') {
      return; // Ya está desbloqueada
    }

    // Buscamos el nodo para obtener la recompensa
    const allNodes = await SkillRepository.findAll();
    const node = allNodes.find(n => n.id === skillId);

    // Persistimos el nodo como completado
    await ProgressRepository.save({
      userId,
      nodeId: skillId,
      status: 'completed',
      currentProgress: 100
    });

    // Otorgamos la experiencia correspondiente al usuario
    if (node && node.xpReward) {
      await this.addExperience(userId, node.xpReward);
    }

    // Aplicamos los cambios/mejoras (Skills-04)
    let effectMessage = '';
    const { WorkoutService } = require('./WorkoutService');
    const { LogService } = require('./LogService');

    const createTemplateWithExercises = async (name: string, exerciseIds: string[]) => {
      const template = await WorkoutService.createEmptyTemplate(userId, name);
      for (let i = 0; i < exerciseIds.length; i++) {
        await LogService.createLog(template.id, exerciseIds[i], [
          { kg: 0, reps: 0, type: 'R', rpe: 0 },
          { kg: 0, reps: 0, type: 'R', rpe: 0 },
          { kg: 0, reps: 0, type: 'R', rpe: 0 }
        ]);
      }
    };

    switch (skillId) {
      case 'sk_1':
        await createTemplateWithExercises('Rutina: Fundamentos de Fuerza', ['ex_1', 'ex_2', 'ex_3']);
        effectMessage = 'Nueva rutina desbloqueada: Fundamentos de Fuerza';
        break;
      case 'sk_2':
        effectMessage = 'Consejo avanzado: Mantén el core apretado y las rodillas alineadas en la sentadilla.';
        break;
      case 'sk_3':
        await createTemplateWithExercises('Rutina: Powerlifting Base', ['ex_2', 'ex_1', 'ex_3', 'ex_4']);
        effectMessage = 'Nueva rutina desbloqueada: Powerlifting Base';
        break;
      case 'sk_4':
        await createTemplateWithExercises('Rutina: Calistenia Inicial', ['ex_5']);
        effectMessage = 'Nueva rutina desbloqueada: Calistenia Inicial';
        break;
      case 'sk_5':
        effectMessage = 'Consejo avanzado: Intenta retraer las escápulas antes de tirar en la dominada.';
        break;
      default:
        effectMessage = 'Has ganado experiencia y mejorado tus habilidades.';
    }

    return { effect: effectMessage };
  },

  async seedSkillsIfEmpty() {
    const existing = await SkillRepository.findAll();
    if (existing.length === 0) {
      const initialSkills: SkillNode[] = [
        { id: 'sk_1', title: 'Fundamentos de Fuerza', branch: 'base', requirementsJson: '{"level": 1}', prevNodeId: null, xpReward: 50 },
        { id: 'sk_2', title: 'Técnica de Sentadilla', branch: 'base', requirementsJson: '{"level": 2}', prevNodeId: 'sk_1', xpReward: 100 },
        { id: 'sk_3', title: 'Powerlifting Base', branch: 'base', requirementsJson: '{"level": 5}', prevNodeId: 'sk_2', xpReward: 200 },
        { id: 'sk_4', title: 'Calistenia Inicial', branch: 'calisthenics', requirementsJson: '{"level": 1}', prevNodeId: null, xpReward: 50 },
        { id: 'sk_5', title: 'Dominio de Pull-up', branch: 'calisthenics', requirementsJson: '{"level": 3}', prevNodeId: 'sk_4', xpReward: 100 },
      ];
      await SkillRepository.saveAll(initialSkills);
    }
  }
};