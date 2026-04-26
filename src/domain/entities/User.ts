export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface UserStats {
  userId: string;
  currentXp: number;
  level: number;
  streakCount: number;
  lastWorkoutDate?: string;
}