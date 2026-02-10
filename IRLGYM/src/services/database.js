import { Platform } from 'react-native';

let db = null;
if (Platform.OS !== 'web') {
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('irlgym.db');
}

const getWebData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const saveWebData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const initDatabase = () => {
  if (Platform.OS === 'web') {
    if (!localStorage.getItem('user_stats')) saveWebData('user_stats', []);
    if (!localStorage.getItem('routines')) saveWebData('routines', []);
    if (!localStorage.getItem('routine_exercises')) saveWebData('routine_exercises', []);
    return;
  }
  // Añadimos campos last_train y streak a user_stats
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
      series TEXT, 
      reps TEXT,
      weight TEXT DEFAULT '0'
    );
  `);
};

// --- GESTIÓN DE XP Y RACHAS (STREAKS) ---

export const updateProgress = (uid, xpAmount) => {
  const today = new Date().toLocaleDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString();

  if (Platform.OS === 'web') {
    const stats = getWebData('user_stats');
    let user = stats.find(u => u.userId === uid);
    
    if (!user) {
      user = { userId: uid, xp: 0, streak: 0, last_train: null };
      stats.push(user);
    }

    // Lógica de Racha
    if (user.last_train === yesterdayStr) {
      user.streak += 1; // Entrenó ayer, racha sube
    } else if (user.last_train !== today) {
      user.streak = 1; // Perdió la racha, vuelve a 1
    }

    user.xp += xpAmount;
    user.last_train = today;
    
    saveWebData('user_stats', stats);
    return user;
  } else {
    // SQLite: Aseguramos que el usuario existe
    db.runSync('INSERT OR IGNORE INTO user_stats (userId, xp, streak, last_train) VALUES (?, 0, 0, NULL)', [uid]);
    
    const user = db.getFirstSync('SELECT * FROM user_stats WHERE userId = ?', [uid]);
    let newStreak = 1;

    if (user.last_train === yesterdayStr) {
      newStreak = user.streak + 1;
    } else if (user.last_train === today) {
      newStreak = user.streak;
    }

    db.runSync(
      'UPDATE user_stats SET xp = xp + ?, streak = ?, last_train = ? WHERE userId = ?',
      [xpAmount, newStreak, today, uid]
    );
    return { xp: user.xp + xpAmount, streak: newStreak };
  }
};

export const getUserStats = (uid) => {
  if (Platform.OS === 'web') {
    const user = getWebData('user_stats').find(u => u.userId === uid);
    return user || { xp: 0, streak: 0, last_train: null };
  }
  const res = db.getFirstSync('SELECT * FROM user_stats WHERE userId = ?', [uid]);
  return res || { xp: 0, streak: 0, last_train: null };
};

// --- GESTIÓN DE RUTINAS ---

export const getRoutines = (uid) => {
  if (Platform.OS === 'web') return getWebData('routines').filter(r => r.userId === uid);
  return db.getAllSync('SELECT * FROM routines WHERE userId = ?', [uid]);
};

export const addRoutine = (uid, name, desc, date) => {
  if (!name.trim()) return false;
  if (Platform.OS === 'web') {
    const routines = getWebData('routines');
    routines.push({ id: Date.now(), userId: uid, name, date });
    saveWebData('routines', routines);
    return true;
  }
  return db.runSync('INSERT INTO routines (userId, name, date) VALUES (?, ?, ?)', [uid, name, date]);
};

export const deleteRoutine = (id) => {
  if (Platform.OS === 'web') {
    const routines = getWebData('routines').filter(r => r.id !== id);
    const exercises = getWebData('routine_exercises').filter(e => e.routine_id !== id);
    saveWebData('routines', routines);
    saveWebData('routine_exercises', exercises);
    return true;
  }
  db.runSync('DELETE FROM routine_exercises WHERE routine_id = ?', [id]);
  return db.runSync('DELETE FROM routines WHERE id = ?', [id]);
};

// --- GESTIÓN DE EJERCICIOS ---

export const getExercisesByRoutine = (rid) => {
  if (Platform.OS === 'web') return getWebData('routine_exercises').filter(e => e.routine_id === rid);
  return db.getAllSync('SELECT * FROM routine_exercises WHERE routine_id = ?', [rid]);
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
  if (Platform.OS === 'web') {
    const ex = getWebData('routine_exercises').map(item => 
      item.id === id ? {...item, series: s, reps: r, weight: w} : item
    );
    saveWebData('routine_exercises', ex);
    return true;
  }
  return db.runSync('UPDATE routine_exercises SET series = ?, reps = ?, weight = ? WHERE id = ?', [s, r, w, id]);
};

export const deleteExerciseFromRoutine = (id) => {
  if (Platform.OS === 'web') {
    const ex = getWebData('routine_exercises').filter(item => item.id !== id);
    saveWebData('routine_exercises', ex);
    return true;
  }
  return db.runSync('DELETE FROM routine_exercises WHERE id = ?', [id]);
};