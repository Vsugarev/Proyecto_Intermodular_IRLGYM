import { UserProgressNode } from "../entities/SkillNode";

export interface IProgressRepository {
  // CREATE / UPDATE
  save(progress: UserProgressNode): Promise<void>;

  // READ
  find(userId: string, nodeId: string): Promise<UserProgressNode | null>;
  findAllByUserId(userId: string): Promise<UserProgressNode[]>;

  // DELETE
  delete(userId: string, nodeId: string): Promise<void>;
  // Resetea todo el árbol de habilidades para un usuario (Re-especialización)
  resetAll(userId: string): Promise<void>;
}