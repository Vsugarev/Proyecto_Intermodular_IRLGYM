export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  weight?: number;
  measurementUnits: 'kg' | 'lb';
}

export interface UserStats {
  userId: string;
  currentXp: number;
  level: number;
  streakCount: number;
  lastWorkoutDate?: string;
}