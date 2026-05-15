import { UserStatsRepository, SkillRepository, ProgressRepository, WorkoutRepository, LogRepository, ExerciseRepository } from '../../data/repositories/index';
import { UserStats } from '../../domain/entities/User';
import { SkillNode, UserProgressNode } from '../../domain/entities/SkillNode';
import { Workout } from '../../domain/entities/Workout';

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
      } else if (stats.streakCount === 0) {
        // Si es la primera vez que entrena (o racha estaba en 0)
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
    for (let i = 1; i < level; i++) total += i * 100;
    return total;
  },

  async validateRequirements(userId: string, requirementsJson: string) {
    if (!requirementsJson) return { ok: true, details: [] };
    const details: { label: string, current: number, required: number, met: boolean, unit: string }[] = [];
    try {
      const req = JSON.parse(requirementsJson);
      const statsData = await UserStatsRepository.findByUserId(userId);
      const stats = statsData || { level: 1, streakCount: 0 };

      if (req.level) details.push({ label: 'Nivel', current: stats.level, required: req.level, met: stats.level >= req.level, unit: '' });
      if (req.streak) details.push({ label: 'Racha', current: stats.streakCount, required: req.streak, met: stats.streakCount >= req.streak, unit: 'sem' });

      const allUserWorkouts = await WorkoutRepository.findAllByUserId(userId);
      const validWorkouts = allUserWorkouts.filter((w: Workout) => w.status === 'completed' && !w.isTemplate);
      const userWorkoutIds = new Set(validWorkouts.map((w: Workout) => w.id));

      if (req.workouts && Array.isArray(req.workouts)) {
        for (const wReq of req.workouts) {
          const template = allUserWorkouts.find((w: Workout) => w.name === wReq.name && w.isTemplate);
          const completedCount = allUserWorkouts.filter((w: Workout) => {
            const isCompleted = w.status === 'completed' && !w.isTemplate;
            const matchesTemplate = template ? w.parentId === template.id : false;
            const matchesName = w.name.includes(wReq.name.replace('Rutina: ', ''));
            return isCompleted && (matchesTemplate || matchesName);
          }).length;
          details.push({ label: `${wReq.name.split(':')[1] || wReq.name}`, current: completedCount, required: wReq.count, met: completedCount >= wReq.count, unit: 'x' });
        }
      }

      if (req.exercises && Array.isArray(req.exercises)) {
        for (const exReq of req.exercises) {
          const exercise = await ExerciseRepository.findById(exReq.id);
          const logs = await LogRepository.findByExerciseId(exReq.id, userId);
          const userLogs = logs.filter((l: any) => userWorkoutIds.has(l.workoutId));
          const totalSeries = userLogs.reduce((acc: number, l: any) => acc + (l.series?.length || 0), 0);
          details.push({ label: `Sets: ${exercise?.name || 'Ej'}`, current: totalSeries, required: exReq.sets, met: totalSeries >= exReq.sets, unit: 'ser' });
        }
      }

      if (req.weights && Array.isArray(req.weights)) {
        for (const wReq of req.weights) {
          const exercise = await ExerciseRepository.findById(wReq.id);
          const logs = await LogRepository.findByExerciseId(wReq.id, userId);
          const userLogs = logs.filter((l: any) => userWorkoutIds.has(l.workoutId));
          let maxWeight = 0;
          userLogs.forEach((l: any) => l.series.forEach((s: any) => { if (s.kg > maxWeight) maxWeight = s.kg; }));
          details.push({ label: `Peso: ${exercise?.name || 'Ej'}`, current: maxWeight, required: wReq.kg, met: maxWeight >= wReq.kg, unit: 'kg' });
        }
      }

      const ok = details.every(d => d.met);
      return { ok, details };
    } catch (e) { return { ok: false, details: [] }; }
  },

  getRewardDetail(skillId: string): string | null {
    switch (skillId) {
      case 'sk_1': return 'Rutina: Fundamentos';
      case 'sk_3': return 'Rutina: Powerlifting Base';
      case 'sk_4': return 'Rutina: Calistenia Inicial';
      case 'sk_8': return 'Rutina: Mastery Muscle-up';
      case 'sk_10': return 'Rutina: Hipertrofia Pierna';
      case 'sk_16': return 'Rutina: ATLETA COMPLETO';
      default: return null;
    }
  },

  async getSkillTree(userId: string) {
    await this.seedSkillsIfEmpty();
    const allNodes = await SkillRepository.findAll();
    const userProgress = await ProgressRepository.findAllByUserId(userId);

    const tree = await Promise.all(allNodes.map(async (node) => {
      const progress = userProgress.find((p: any) => p.nodeId === node.id);
      let status: 'locked' | 'available' | 'completed' | 'requirements_pending' = 'locked';
      
      if (progress && progress.status === 'completed') {
        status = 'completed';
      } else {
        const isFirstNode = !node.prevNodeId;
        const prevNodeCompleted = node.prevNodeId ? 
          userProgress.find((p: any) => p.nodeId === node.prevNodeId)?.status === 'completed' : false;

        const { ok: meetsRequirements, details } = await this.validateRequirements(userId, node.requirementsJson || '');
        if (isFirstNode || prevNodeCompleted) status = meetsRequirements ? 'available' : 'requirements_pending';
        else status = 'locked';
        (node as any).requirementDetails = details;
      }
      (node as any).rewardDetail = this.getRewardDetail(node.id);
      return { ...node, status };
    }));
    return tree;
  },

  async getHomeProgress(userId: string) {
    const tree = await this.getSkillTree(userId);
    const completedCount = tree.filter(n => n.status === 'completed').length;
    const totalCount = tree.length;
    const nextNode = tree.find(n => n.status === 'available' || n.status === 'requirements_pending');
    return { completedCount, totalCount, nextNode, overallProgress: totalCount > 0 ? completedCount / totalCount : 0 };
  },

  async unlockSkill(userId: string, skillId: string): Promise<{ effect: string } | void> {
    const userProgress = await ProgressRepository.findAllByUserId(userId);
    const existingProgress = userProgress.find((p: any) => p.nodeId === skillId);
    if (existingProgress && existingProgress.status === 'completed') return;

    const node = await SkillRepository.findById(skillId);
    if (!node) return;

    const { ok: canUnlock } = await this.validateRequirements(userId, node.requirementsJson || '');
    if (!canUnlock) throw new Error("No cumples los requisitos");

    await ProgressRepository.save({ userId, nodeId: skillId, status: 'completed', currentProgress: 100 });
    if (node.xpReward) await this.addExperience(userId, node.xpReward);

    const rewardName = this.getRewardDetail(skillId);
    if (rewardName && rewardName.startsWith('Rutina: ')) {
      const { WorkoutService } = require('./WorkoutService');
      await WorkoutService.createRewardWorkout(userId, rewardName);
    }

    let effectMessage = 'Has ganado experiencia y mejorado tus habilidades.';
    return { effect: effectMessage };
  },

  async seedSkillsIfEmpty() {
    const initialSkills: SkillNode[] = [
      { id: 'sk_1', title: 'Fundamentos de Fuerza', branch: 'base', requirementsJson: '{"level": 1}', prevNodeId: null, xpReward: 50 },
      { id: 'sk_2', title: 'Técnica de Sentadilla', branch: 'base', requirementsJson: '{"level": 2, "exercises": [{"id": "ex_2", "sets": 3}]}', prevNodeId: 'sk_1', xpReward: 100 },
      { id: 'sk_3', title: 'Powerlifting Base', branch: 'base', requirementsJson: '{"level": 5, "workouts": [{"name": "Rutina: Fundamentos", "count": 2}]}', prevNodeId: 'sk_2', xpReward: 200 },
      { id: 'sk_11', title: 'Maestro del Press', branch: 'base', requirementsJson: '{"level": 8, "weights": [{"id": "ex_1", "kg": 60}]}', prevNodeId: 'sk_3', xpReward: 250 },
      { id: 'sk_12', title: 'Rey del Peso Muerto', branch: 'base', requirementsJson: '{"level": 10, "weights": [{"id": "ex_3", "kg": 100}]}', prevNodeId: 'sk_11', xpReward: 300 },
      { id: 'sk_15', title: 'Guerrero de Hierro', branch: 'base', requirementsJson: '{"level": 15, "weights": [{"id": "ex_2", "kg": 120}]}', prevNodeId: 'sk_12', xpReward: 500 },
      { id: 'sk_20', title: 'Mentalidad de Acero', branch: 'base', requirementsJson: '{"level": 25, "streak": 12}', prevNodeId: 'sk_15', xpReward: 2000 },
      
      { id: 'sk_4', title: 'Calistenia Inicial', branch: 'calisthenics', requirementsJson: '{"level": 1}', prevNodeId: null, xpReward: 50 },
      { id: 'sk_5', title: 'Dominio de Pull-up', branch: 'calisthenics', requirementsJson: '{"level": 3, "exercises": [{"id": "ex_5", "sets": 5}]}', prevNodeId: 'sk_4', xpReward: 100 },
      { id: 'sk_6', title: 'Fondos Explosivos', branch: 'calisthenics', requirementsJson: '{"level": 5, "exercises": [{"id": "ex_26", "sets": 6}]}', prevNodeId: 'sk_5', xpReward: 150 },
      { id: 'sk_7', title: 'Camino al Muscle-up', branch: 'calisthenics', requirementsJson: '{"level": 8, "workouts": [{"name": "Rutina: Calistenia Inicial", "count": 5}]}', prevNodeId: 'sk_6', xpReward: 200 },
      { id: 'sk_8', title: 'Maestría del Muscle-up', branch: 'calisthenics', requirementsJson: '{"level": 12, "exercises": [{"id": "ex_31", "sets": 1}]}', prevNodeId: 'sk_7', xpReward: 400 },
      { id: 'sk_16', title: 'Atleta Completo', branch: 'calisthenics', requirementsJson: '{"level": 20, "streak": 8}', prevNodeId: 'sk_8', xpReward: 1000 },
      
      { id: 'sk_9', title: 'Hipertrofia: Torso', branch: 'hypertrophy', requirementsJson: '{"level": 4}', prevNodeId: null, xpReward: 150 },
      { id: 'sk_10', title: 'Hipertrofia: Pierna', branch: 'hypertrophy', requirementsJson: '{"level": 4}', prevNodeId: null, xpReward: 150 },
      { id: 'sk_13', title: 'Conexión Mente-Músculo', branch: 'hypertrophy', requirementsJson: '{"level": 7, "exercises": [{"id": "ex_22", "sets": 8}, {"id": "ex_24", "sets": 8}]}', prevNodeId: 'sk_9', xpReward: 200 },
      { id: 'sk_14', title: 'Definición Muscular', branch: 'hypertrophy', requirementsJson: '{"level": 10, "streak": 2}', prevNodeId: 'sk_13', xpReward: 300 },
    ];

    const existing = await SkillRepository.findAll();
    if (existing.length !== initialSkills.length) {
      await SkillRepository.deleteAll();
      await SkillRepository.saveAll(initialSkills);
    }
  }
};