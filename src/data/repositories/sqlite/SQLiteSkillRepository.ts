import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { SkillNode } from '../../../domain/entities/SkillNode';
import { TrainingBranch } from '../../../domain/entities/LibraryExercise';
import { ISkillRepository } from '../../../domain/repositoriesInterface/ISkillRepository';

export class SQLiteSkillRepository implements ISkillRepository {
  
  async deleteAll(): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM skill_nodes');
  }

  async save(node: SkillNode): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      `INSERT INTO skill_nodes (id, title, branch, requirements_json, prev_node_id, xp_reward) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title,
         branch=excluded.branch,
         requirements_json=excluded.requirements_json,
         prev_node_id=excluded.prev_node_id,
         xp_reward=excluded.xp_reward`,
      [node.id, node.title, node.branch, node.requirementsJson, node.prevNodeId, node.xpReward]
    );
  }

  async saveAll(nodes: SkillNode[]): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.withTransactionAsync(async () => {
      for (const node of nodes) {
        await this.save(node);
      }
    });
  }

  async findById(id: string): Promise<SkillNode | null> {
    const db = await SQLiteClient.getInstance();
    const row = await db.getFirstAsync<any>(
      'SELECT id, title, branch, requirements_json as requirementsJson, prev_node_id as prevNodeId, xp_reward as xpReward FROM skill_nodes WHERE id = ?', 
      [id]
    );
    return row || null;
  }

  async findAll(): Promise<SkillNode[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>(
      'SELECT id, title, branch, requirements_json as requirementsJson, prev_node_id as prevNodeId, xp_reward as xpReward FROM skill_nodes'
    );
    return rows as SkillNode[];
  }

  async findByBranch(branch: TrainingBranch): Promise<SkillNode[]> {
    const db = await SQLiteClient.getInstance();
    const rows = await db.getAllAsync<any>(
      'SELECT id, title, branch, requirements_json as requirementsJson, prev_node_id as prevNodeId, xp_reward as xpReward FROM skill_nodes WHERE branch = ?', 
      [branch]
    );
    return rows as SkillNode[];
  }

  async update(node: SkillNode): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE skill_nodes SET title = ?, branch = ?, requirements_json = ?, prev_node_id = ?, xp_reward = ? WHERE id = ?',
      [node.title, node.branch, node.requirementsJson, node.prevNodeId, node.xpReward, node.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM skill_nodes WHERE id = ?', [id]);
  }
}