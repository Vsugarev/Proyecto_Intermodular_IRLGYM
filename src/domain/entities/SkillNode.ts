import { TrainingBranch } from './LibraryExercise';

export interface SkillNode {
  id: string;
  title: string;
  branch: TrainingBranch; 
  requirementsJson: string;
  prevNodeId: string | null;
  xpReward: number;
}

export interface UserProgressNode {
  userId: string;
  nodeId: string;
  status: 'locked' | 'available' | 'completed';
  currentProgress: number;
}