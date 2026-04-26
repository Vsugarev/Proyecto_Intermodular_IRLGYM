import { SkillNode } from "../entities/SkillNode";
import { TrainingBranch } from "../entities/LibraryExercise";

export interface ISkillRepository {
  // CREATE
  save(node: SkillNode): Promise<void>;
  saveAll(nodes: SkillNode[]): Promise<void>; 

  // READ
  findById(id: string): Promise<SkillNode | null>;
  findAll(): Promise<SkillNode[]>;
  findByBranch(branch: TrainingBranch): Promise<SkillNode[]>;
  
  // UPDATE
  update(node: SkillNode): Promise<void>;

  // DELETE
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>; 
}