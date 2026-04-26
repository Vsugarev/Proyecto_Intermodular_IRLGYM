export type TrainingBranch = 'powerlifting' | 'hypertrophy' | 'base' | 'calisthenics';

export interface LibraryExercise {
  id: string;
  name: string;
  category: string; 
  branch: TrainingBranch;
  isCustom: boolean;
}