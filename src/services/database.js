import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('irlgym.db');

export const initDatabase = () => {
  try {
    // Si necesitas resetear porque falta la columna userId, quita las // de abajo:
    // db.execSync('DROP TABLE IF EXISTS routine_exercises;');
    // db.execSync('DROP TABLE IF EXISTS routines;');
    // db.execSync('DROP TABLE IF EXISTS user_stats;');

    db.execSync('PRAGMA foreign_keys = ON;');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user_stats (
        userId TEXT PRIMARY KEY,
        xp INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        name TEXT NOT NULL,
        description TEXT,
        date TEXT
      );
      CREATE TABLE IF NOT EXISTS routine_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER,
        exercise_name TEXT,
        series TEXT,
        reps TEXT,
        FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Base de Datos Inicializada");
  } catch (error) {
    console.error("❌ Error en initDatabase:", error);
  }
};

export const addXP = (userId, amount) => {
  try {
    if (!userId) return false;
    db.runSync('INSERT OR IGNORE INTO user_stats (userId, xp) VALUES (?, 0)', [userId]);
    db.runSync('UPDATE user_stats SET xp = xp + ? WHERE userId = ?', [amount, userId]);
    return true;
  } catch (error) { return false; }
};

export const getUserXP = (userId) => {
  try {
    if (!userId) return 0;
    const res = db.getFirstSync('SELECT xp FROM user_stats WHERE userId = ?', [userId]);
    return res ? res.xp : 0;
  } catch (error) { return 0; }
};

export const addRoutine = (userId, name, description, date) => {
  try {
    if (!userId) return false;
    const result = db.runSync(
      'INSERT INTO routines (userId, name, description, date) VALUES (?, ?, ?, ?)',
      [userId, name, description, date]
    );
    return true;
  } catch (error) { return false; }
};

export const getRoutines = (userId) => {
  try {
    if (!userId) return [];
    return db.getAllSync('SELECT * FROM routines WHERE userId = ?', [userId]);
  } catch (error) { return []; }
};

export const deleteRoutine = (id) => {
  try {
    db.runSync('DELETE FROM routines WHERE id = ?', [id]);
    return true;
  } catch (error) { return false; }
};

export const getExercisesByRoutine = (routineId) => {
  return db.getAllSync('SELECT * FROM routine_exercises WHERE routine_id = ?', [routineId]);
};

export const addExerciseToRoutine = (routineId, exerciseName) => {
  try {
    db.runSync(
      'INSERT INTO routine_exercises (routine_id, exercise_name, series, reps) VALUES (?, ?, "0", "0")',
      [routineId, exerciseName]
    );
    return true;
  } catch (error) { return false; }
};

// --- ACTUALIZAR EJERCICIO ---
export const updateExerciseStats = (id, series, reps) => {
  try {
    db.runSync(
      'UPDATE routine_exercises SET series = ?, reps = ? WHERE id = ?',
      [series, reps, id]
    );
    return true;
  } catch (error) {
    console.error("Error al actualizar ejercicio:", error);
    return false;
  }
};

// --- BORRAR EJERCICIO ---
export const deleteExerciseFromRoutine = (id) => {
  try {
    db.runSync('DELETE FROM routine_exercises WHERE id = ?', [id]);
    return true;
  } catch (error) { return false; }
};