import { SkillRepository } from '../../data/repositories/index';
import { SkillNode } from '../../domain/entities/SkillNode';

export const SkillService = {
  async getAllSkills() {
    return await SkillRepository.findAll();
  },

  async getSkillById(id: string) {
    return await SkillRepository.findById(id);
  }
};