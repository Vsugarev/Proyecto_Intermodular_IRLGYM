import { SQLiteClient } from './SQLiteClient';

export const initDatabase = async () => {
  const db = await SQLiteClient.getInstance();

  await db.execAsync('PRAGMA foreign_keys = ON;');

  const tables = [
    `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL,
      email TEXT,
      avatar_url TEXT,
      weight REAL,
      measurement_units TEXT DEFAULT 'kg',
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
      branch TEXT NOT NULL,
      muscle_group TEXT,
      description TEXT,
      image_url TEXT,
      is_custom INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0
    );`,

    `CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress',
      is_template INTEGER DEFAULT 0,
      parent_id TEXT,
      sync_status INTEGER DEFAULT 1,
      FOREIGN KEY(userId) REFERENCES profiles(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY NOT NULL,
      workoutId TEXT NOT NULL,
      exerciseId TEXT NOT NULL,
      series_json TEXT NOT NULL,
      note TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY(workoutId) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY(exerciseId) REFERENCES library_exercises(id)
    );`,

    `CREATE TABLE IF NOT EXISTS skill_nodes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      branch TEXT NOT NULL, 
      requirements_json TEXT,
      prev_node_id TEXT,
      xp_reward INTEGER DEFAULT 0
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

  // Migración manual para añadir is_template si ya existe la tabla
  try {
    await db.execAsync('ALTER TABLE workouts ADD COLUMN is_template INTEGER DEFAULT 0;');
  } catch (e) {
    // La columna probablemente ya existe
  }

  try {
    await db.execAsync('ALTER TABLE workouts ADD COLUMN parent_id TEXT;');
  } catch (e) {
    // La columna probablemente ya existe
  }

  try {
    await db.execAsync('ALTER TABLE profiles ADD COLUMN email TEXT;');
    await db.execAsync('ALTER TABLE profiles ADD COLUMN weight REAL;');
    await db.execAsync("ALTER TABLE profiles ADD COLUMN measurement_units TEXT DEFAULT 'kg';");
  } catch (e) {
    // Columnas probablemente ya existen
  }

  // Seed de ejercicios si está vacía
  const exerciseCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM library_exercises');
  if (exerciseCount?.count === 0) {
    console.log("Sembrando base de datos con ejercicios iniciales...");
    const initialExercises = [
      ['ex_1', 'Press de Banca', 'Pecho', 'base', 'Pecho', 'Acuéstate en un banco plano y empuja la barra hacia arriba.', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHYyeGNuM3Z4Z3Z4Z3Z4Z3Z4Z3Z4Z3Z4Z3Z4Z3Z4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKL9bV6X2e2I1G0/giphy.gif'],
      ['ex_2', 'Sentadilla con Barra', 'Pierna', 'base', 'Cuádriceps', 'Baja la cadera manteniendo la espalda recta.', null],
      ['ex_3', 'Peso Muerto', 'Espalda', 'base', 'Posteriores', 'Levanta la barra desde el suelo manteniendo la espalda neutra.', null],
      ['ex_4', 'Press Militar', 'Hombro', 'base', 'Hombro', 'Empuja la barra sobre tu cabeza desde los hombros.', null],
      ['ex_5', 'Dominadas', 'Espalda', 'calisthenics', 'Dorsales', 'Levanta tu propio peso hasta que la barbilla pase la barra.', null]
    ];

    for (const ex of initialExercises) {
      await db.runAsync(
        'INSERT INTO library_exercises (id, name, category, branch, muscle_group, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ex
      );
    }
  }
};