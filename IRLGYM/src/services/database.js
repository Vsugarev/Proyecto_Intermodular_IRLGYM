import { Platform } from 'react-native';

let db = null;
if (Platform.OS !== 'web') {
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('irlgym.db');
}

const getWebData = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    console.error("Error leyendo localStorage", e);
    return [];
  }
};

const saveWebData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Error guardando en localStorage", e);
  }
};

// Formateadores seguros de fecha
const getTodayStr = () => new Date().toISOString().split('T')[0];
const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

export const initDatabase = () => {
  if (Platform.OS === 'web') {
    if (!localStorage.getItem('user_stats')) saveWebData('user_stats', []);
    if (!localStorage.getItem('routines')) saveWebData('routines', []);
    if (!localStorage.getItem('routine_exercises')) saveWebData('routine_exercises', []);
    if (!localStorage.getItem('exercise_history')) saveWebData('exercise_history', []);
    return;
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS user_stats (
      userId TEXT PRIMARY KEY, 
      xp INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_train TEXT
    );
    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      userId TEXT, 
      name TEXT, 
      date TEXT
    );
    CREATE TABLE IF NOT EXISTS routine_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      routine_id INTEGER, 
      exercise_name TEXT, 
      series TEXT DEFAULT '0', 
      reps TEXT DEFAULT '0', 
      weight TEXT DEFAULT '0'
    );
    CREATE TABLE IF NOT EXISTS exercise_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      exercise_name TEXT,
      weight REAL,
      date TEXT
    );
  `);
};

// --- GESTIÓN DE STATS (SALUD MEJORADA) ---

export const getUserStats = (uid) => {
  const defaultStats = { userId: uid, xp: 0, streak: 0, last_train: null };
  try {
    if (Platform.OS === 'web') {
      const allStats = getWebData('user_stats');
      const user = allStats.find(s => s.userId === uid);
      return user || defaultStats;
    }
    const res = db.getFirstSync('SELECT * FROM user_stats WHERE userId = ?', [uid]);
    return res || defaultStats;
  } catch (e) {
    return defaultStats;
  }
};

export const updateProgress = (uid, points, exercises) => {
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  let stats = getUserStats(uid);

  // Lógica de racha mejorada
  if (stats.last_train === yesterday) {
    stats.streak += 1;
  } else if (stats.last_train !== today) {
    stats.streak = 1;
  }

  stats.xp += points;
  stats.last_train = today;

  // Guardar stats del usuario
  if (Platform.OS === 'web') {
    const allStats = getWebData('user_stats').filter(s => s.userId !== uid);
    allStats.push(stats);
    saveWebData('user_stats', allStats);
  } else {
    db.runSync(
      'INSERT OR REPLACE INTO user_stats (userId, xp, streak, last_train) VALUES (?, ?, ?, ?)',
      [uid, stats.xp, stats.streak, stats.last_train]
    );
  }


  // Guardar historial de ejercicios (para gráficas) de forma segura
  exercises.forEach(ex => {
    const weightNum = parseFloat(String(ex.weight).replace(',', '.')) || 0;
    if (Platform.OS === 'web') {
      const history = getWebData('exercise_history');
      history.push({ userId: uid, exercise_name: ex.exercise_name, weight: weightNum, date: today });
      saveWebData('exercise_history', history);
    } else {
      db.runSync(
        'INSERT INTO exercise_history (userId, exercise_name, weight, date) VALUES (?, ?, ?, ?)',
        [uid, ex.exercise_name, weightNum, today]
      );
    }
  });

  return stats;
};

export const getTrainingDays = (uid) => {
  if (Platform.OS === 'web') {
    const history = getWebData('exercise_history');
    // Filtramos por usuario y extraemos solo las fechas únicas
    const dates = history
      .filter(h => h.userId === uid)
      .map(h => h.date);
    return [...new Set(dates)]; // Retorna array de fechas sin duplicados
  } else {
    const res = db.getAllSync(
      'SELECT DISTINCT date FROM exercise_history WHERE userId = ?',
      [uid]
    );
    return res.map(r => r.date);
  }
};

// --- GESTIÓN DE RUTINAS ---

export const getRoutines = (uid) => {
  try {
    if (Platform.OS === 'web') return getWebData('routines').filter(r => r.userId === uid);
    return db.getAllSync('SELECT * FROM routines WHERE userId = ?', [uid]);
  } catch (e) {
    return [];
  }
};

export const addRoutine = (uid, name) => {
  const today = getTodayStr();
  try {
    if (Platform.OS === 'web') {
      const r = getWebData('routines');
      r.push({ id: Date.now(), userId: uid, name, date: today });
      saveWebData('routines', r);
      return true;
    }
    db.runSync('INSERT INTO routines (userId, name, date) VALUES (?, ?, ?)', [uid, name, today]);
    return true;
  } catch (e) {
    return false;
  }
};

export const deleteRoutine = (id) => {
  if (Platform.OS === 'web') {
    saveWebData('routines', getWebData('routines').filter(r => r.id !== id));
    saveWebData('routine_exercises', getWebData('routine_exercises').filter(e => e.routine_id !== id));
  } else {
    db.runSync('DELETE FROM routines WHERE id = ?', [id]);
    db.runSync('DELETE FROM routine_exercises WHERE routine_id = ?', [id]);
  }
};

// --- GESTIÓN DE EJERCICIOS ---

export const getExercisesByRoutine = (rid) => {
  try {
    if (Platform.OS === 'web') return getWebData('routine_exercises').filter(e => e.routine_id === rid);
    return db.getAllSync('SELECT * FROM routine_exercises WHERE routine_id = ?', [rid]);
  } catch (e) {
    return [];
  }
};

export const addExerciseToRoutine = (rid, name) => {
  if (Platform.OS === 'web') {
    const ex = getWebData('routine_exercises');
    ex.push({ id: Date.now(), routine_id: rid, exercise_name: name, series: "0", reps: "0", weight: "0" });
    saveWebData('routine_exercises', ex);
    return true;
  }
  return db.runSync('INSERT INTO routine_exercises (routine_id, exercise_name, series, reps, weight) VALUES (?, ?, "0", "0", "0")', [rid, name]);
};

export const updateExerciseStats = (id, s, r, w) => {
  // Limpieza de datos: asegurar que si viene vacío se guarde "0"
  const safeS = s || "0";
  const safeR = r || "0";
  const safeW = w || "0";

  if (Platform.OS === 'web') {
    const ex = getWebData('routine_exercises').map(item => 
      item.id === id ? {...item, series: safeS, reps: safeR, weight: safeW} : item
    );
    saveWebData('routine_exercises', ex);
    return true;
  }
  return db.runSync('UPDATE routine_exercises SET series = ?, reps = ?, weight = ? WHERE id = ?', [safeS, safeR, safeW, id]);
};

export const deleteExerciseFromRoutine = (id) => {
  if (Platform.OS === 'web') {
    saveWebData('routine_exercises', getWebData('routine_exercises').filter(e => e.id !== id));
  } else {
    db.runSync('DELETE FROM routine_exercises WHERE id = ?', [id]);
  }
};

export const getExerciseHistory = (uid, exerciseName) => {
  try {
    if (Platform.OS === 'web') {
      return getWebData('exercise_history')
        .filter(h => h.userId === uid && h.exercise_name === exerciseName)
        .map(h => h.weight);
    }
    const res = db.getAllSync('SELECT weight FROM exercise_history WHERE userId = ? AND exercise_name = ? ORDER BY date ASC', [uid, exerciseName]);
    return res.map(r => r.weight);
  } catch (e) {
    return [];
  }
};