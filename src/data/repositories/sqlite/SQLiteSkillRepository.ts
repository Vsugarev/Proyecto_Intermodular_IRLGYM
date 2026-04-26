import { SQLiteClient } from '../../../infrastructure/database/SQLiteClient';
import { SkillNode } from '../../../domain/entities/SkillNode';
import { TrainingBranch } from '../../../domain/entities/LibraryExercise';
import { ISkillRepository } from '../../../domain/repositoriesInterface/ISkillRepository';

export class SQLiteSkillRepository implements ISkillRepository {

  async save(node: SkillNode): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'INSERT OR REPLACE INTO skill_nodes (id, title, branch, requirementsJson, prevNodeId, xpReward) VALUES (?, ?, ?, ?, ?, ?)',
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
    return await db.getFirstAsync<SkillNode>('SELECT * FROM skill_nodes WHERE id = ?', [id]);
  }

  async findAll(): Promise<SkillNode[]> {
    const db = await SQLiteClient.getInstance();
    return await db.getAllAsync<SkillNode>('SELECT * FROM skill_nodes');
  }

  async findByBranch(branch: TrainingBranch): Promise<SkillNode[]> {
    const db = await SQLiteClient.getInstance();
    return await db.getAllAsync<SkillNode>('SELECT * FROM skill_nodes WHERE branch = ?', [branch]);
  }

  async update(node: SkillNode): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync(
      'UPDATE skill_nodes SET title = ?, branch = ?, requirementsJson = ?, prevNodeId = ?, xpReward = ? WHERE id = ?',
      [node.title, node.branch, node.requirementsJson, node.prevNodeId, node.xpReward, node.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM skill_nodes WHERE id = ?', [id]);
  }

  async deleteAll(): Promise<void> {
    const db = await SQLiteClient.getInstance();
    await db.runAsync('DELETE FROM skill_nodes');
  }
}