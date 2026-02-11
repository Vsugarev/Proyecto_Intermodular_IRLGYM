import { Platform } from 'react-native';

let db = null;
if (Platform.OS !== 'web') {
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('irlgym.db');
}

const getWebData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const saveWebData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Formateador de fecha ISO (seguro para bases de datos)
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

  // SQLite: Creación de tablas base
  db.execSync(`
    CREATE TABLE IF NOT EXISTS user_stats (
      userId TEXT PRIMARY KEY, 
      xp INTEGER DEFAULT 0,
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
    CREATE TABLE IF NOT EXISTS exercise_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      exercise_name TEXT,
      weight REAL,
      date TEXT
    );
  `);

  // MIGRACIÓN: Forzamos la creación de la columna streak por si la tabla ya existía
  try {
    db.execSync("ALTER TABLE user_stats ADD COLUMN streak INTEGER DEFAULT 0;");
    console.log("Columna 'streak' verificada/añadida.");
  } catch (e) {
    // Si ya existe, no hace nada
  }
};

// --- GESTIÓN DE XP, RACHAS E HISTORIAL ---

export const updateProgress = (uid, xpAmount, currentExercises = []) => {
  const today = getTodayStr();
  const yesterdayStr = getYesterdayStr();

  if (Platform.OS === 'web') {
    const stats = getWebData('user_stats');
    const history = getWebData('exercise_history');
    let user = stats.find(u => u.userId === uid);
    
    if (!user) {
      user = { userId: uid, xp: 0, streak: 0, last_train: null };
      stats.push(user);
    }

    // Lógica de Racha
    if (user.last_train === yesterdayStr) {
      user.streak += 1;
    } else if (user.last_train !== today) {
      user.streak = 1;
    }

    user.xp += xpAmount;
    user.last_train = today;

    // Guardar Historial
    currentExercises.forEach(ex => {
      if (parseFloat(ex.weight) > 0) {
        history.push({
          userId: uid,
          exercise_name: ex.exercise_name,
          weight: parseFloat(ex.weight),
          date: today
        });
      }
    });

    saveWebData('user_stats', stats);
    saveWebData('exercise_history', history);
    return user;

  } else {
    // SQLite: Aseguramos que el usuario existe
    db.runSync('INSERT OR IGNORE INTO user_stats (userId, xp, streak, last_train) VALUES (?, 0, 0, NULL)', [uid]);
    const user = db.getFirstSync('SELECT * FROM user_stats WHERE userId = ?', [uid]);
    
    let newStreak = user.streak || 0;
    if (user.last_train === yesterdayStr) {
      newStreak += 1;
    } else if (user.last_train !== today) {
      newStreak = 1;
    }

    db.runSync(
      'UPDATE user_stats SET xp = xp + ?, streak = ?, last_train = ? WHERE userId = ?',
      [xpAmount, newStreak, today, uid]
    );

    currentExercises.forEach(ex => {
      if (parseFloat(ex.weight) > 0) {
        db.runSync(
          'INSERT INTO exercise_history (userId, exercise_name, weight, date) VALUES (?, ?, ?, ?)',
          [uid, ex.exercise_name, parseFloat(ex.weight), today]
        );
      }
    });

    return { xp: user.xp + xpAmount, streak: newStreak };
  }
};

export const getExerciseHistory = (uid, exerciseName) => {
  if (Platform.OS === 'web') {
    return getWebData('exercise_history')
      .filter(h => h.userId === uid && h.exercise_name === exerciseName)
      .map(h => h.weight);
  } else {
    const res = db.getAllSync(
      'SELECT weight FROM exercise_history WHERE userId = ? AND exercise_name = ? ORDER BY id ASC',
      [uid, exerciseName]
    );
    return res.map(h => h.weight);
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
  // Usamos el formato ISO para la fecha de creación interna también
  const finalDate = date || getTodayStr(); 
  
  if (Platform.OS === 'web') {
    const routines = getWebData('routines');
    routines.push({ id: Date.now(), userId: uid, name, date: finalDate });
    saveWebData('routines', routines);
    return true;
  }
  return db.runSync('INSERT INTO routines (userId, name, date) VALUES (?, ?, ?)', [uid, name, finalDate]);
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