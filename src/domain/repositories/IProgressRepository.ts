import { UserProgressNode } from "../entities/SkillNode";

export interface IProgressRepository {
  // CREATE / UPDATE
  saveProgress(progress: UserProgressNode): Promise<void>;

  // READ
  findProgress(userId: string, nodeId: string): Promise<UserProgressNode | null>;
  findAllPlayerProgress(userId: string): Promise<UserProgressNode[]>;

  // DELETE
  deleteProgress(userId: string, nodeId: string): Promise<void>;
  // Resetea todo el árbol de habilidades para un usuario (Re-especialización)
  resetAllProgress(userId: string): Promise<void>;
}