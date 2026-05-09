export interface Set {
  kg: number;
  reps: number;
  type: 'R' | 'W' | 'D' | 'F'; 
  rpe?: number;
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  exerciseId: string;
  series: Set[];
  note?: string;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  date: string;
  status: 'completed' | 'in_progress';
  isTemplate?: boolean;
}
