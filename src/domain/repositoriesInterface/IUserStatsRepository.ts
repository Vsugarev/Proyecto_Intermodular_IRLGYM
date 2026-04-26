import { UserStats } from "../entities/User";

export interface IUserStatsRepository {
  // CREATE
  save(stats: UserStats): Promise<void>;

  // READ
  findByUserId(userId: string): Promise<UserStats | null>;

  // UPDATE
  update(stats: UserStats): Promise<void>;

  // DELETE
  deleteByUserId(userId: string): Promise<void>;
}