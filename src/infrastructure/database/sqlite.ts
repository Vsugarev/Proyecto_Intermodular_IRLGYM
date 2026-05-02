import * as SQLite from 'expo-sqlite';

export const initDatabase = async () => {
  const db = await SQLite.openDatabaseAsync('gym_rpg.db');

  await db.execAsync('PRAGMA foreign_keys = ON;');

  const tables = [
    `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT,
      avatar_url TEXT,
      sync_status INTEGER DEFAULT 0,
      updated_at INTEGER
    );`,

    `CREATE TABLE IF NOT EXISTS user_stats (
      userId TEXT PRIMARY KEY NOT NULL,
      current_xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak_count INTEGER DEFAULT 0,
      last_workout_date TEXT,
      is_dirty INTEGER DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES profiles(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS library_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      branch TEXT,
      is_custom INTEGER DEFAULT 0
    );`,

    `CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      name TEXT,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress',
      sync_status INTEGER DEFAULT 1,
      FOREIGN KEY(userId) REFERENCES profiles(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY NOT NULL,
      workoutId TEXT NOT NULL,
      exerciseId TEXT NOT NULL,
      series_json TEXT NOT NULL, -- IMPORTANTE: Asegúrate que el repo use 'series_json'
      note TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY(workoutId) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY(exerciseId) REFERENCES library_exercises(id)
    );`,

    `CREATE TABLE IF NOT EXISTS skill_nodes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      branch TEXT,
      requirements_json TEXT,
      prev_node_id TEXT,
      xp_reward INTEGER
    );`,

    `CREATE TABLE IF NOT EXISTS user_progress_nodes (
      userId TEXT NOT NULL,
      nodeId TEXT NOT NULL,
      status TEXT DEFAULT 'locked',
      current_progress REAL DEFAULT 0,
      sync_status INTEGER DEFAULT 0,
      PRIMARY KEY (userId, nodeId),
      FOREIGN KEY(userId) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY(nodeId) REFERENCES skill_nodes(id) ON DELETE CASCADE
    );`
  ];

  for (const table of tables) {
    await db.execAsync(table);
  }
};