import { SQLiteClient } from './SQLiteClient';

const TABLE_DEFINITIONS = [
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

const INITIAL_EXERCISES = [
  ['ex_1', 'Press de Banca', 'Pecho', 'base', 'Pecho', 'Acuéstate en un banco plano y empuja la barra hacia arriba.', null],
  ['ex_2', 'Sentadilla con Barra', 'Pierna', 'base', 'Cuádriceps', 'Baja la cadera manteniendo la espalda recta.', null],
  ['ex_3', 'Peso Muerto', 'Espalda', 'base', 'Posteriores', 'Levanta la barra desde el suelo manteniendo la espalda neutra.', null],
  ['ex_4', 'Press Militar', 'Hombro', 'base', 'Hombro', 'Empuja la barra sobre tu cabeza desde los hombros.', null],
  ['ex_5', 'Dominadas', 'Espalda', 'calisthenics', 'Dorsales', 'Levanta tu propio peso hasta que la barbilla pase la barra.', null],
  ['ex_6', 'Press Inclinado Mancuernas', 'Pecho', 'base', 'Pecho Superior', 'Empuja las mancuernas en un banco inclinado.', null],
  ['ex_7', 'Aperturas con Mancuernas', 'Pecho', 'base', 'Pecho', 'Abre los brazos con mancuernas simulando un abrazo.', null],
  ['ex_8', 'Cruce de Poleas', 'Pecho', 'base', 'Pecho', 'Cruza los cables frente a ti para aislar el pectoral.', null],
  ['ex_9', 'Flexiones', 'Pecho', 'calisthenics', 'Pecho', 'Ejercicio básico de empuje con peso corporal.', null],
  ['ex_10', 'Remo con Barra', 'Espalda', 'base', 'Espalda Media', 'Tira de la barra hacia tu ombligo inclinado.', null],
  ['ex_11', 'Jalón al Pecho', 'Espalda', 'base', 'Dorsales', 'Tira de la barra de polea alta hacia tu pecho.', null],
  ['ex_12', 'Remo en Polea Baja', 'Espalda', 'base', 'Espalda', 'Remo horizontal sentado con polea.', null],
  ['ex_13', 'Hiperextensiones', 'Espalda', 'base', 'Lumbares', 'Extensión de tronco para fortalecer la espalda baja.', null],
  ['ex_14', 'Prensa de Piernas', 'Pierna', 'base', 'Piernas', 'Empuja la plataforma con tus piernas.', null],
  ['ex_15', 'Extensiones Cuádriceps', 'Pierna', 'base', 'Cuádriceps', 'Extensión de rodilla en máquina.', null],
  ['ex_16', 'Curl Femoral', 'Pierna', 'base', 'Isquios', 'Flexión de rodilla en máquina para el femoral.', null],
  ['ex_17', 'Zancadas', 'Pierna', 'base', 'Piernas', 'Paso largo hacia adelante bajando la rodilla trasera.', null],
  ['ex_18', 'Elevación de Talones', 'Pierna', 'base', 'Gemelos', 'Ponte de puntillas para trabajar el sóleo y gemelo.', null],
  ['ex_19', 'Press Arnold', 'Hombro', 'base', 'Hombro', 'Press de hombros rotando las muñecas.', null],
  ['ex_20', 'Elevaciones Laterales', 'Hombro', 'base', 'Deltoide Lateral', 'Eleva los brazos hacia los lados con mancuernas.', null],
  ['ex_21', 'Face Pulls', 'Hombro', 'base', 'Deltoide Posterior', 'Tira de la cuerda hacia tu cara en polea alta.', null],
  ['ex_22', 'Curl de Bíceps con Barra', 'Brazo', 'base', 'Bíceps', 'Flexión de codo con barra de pie.', null],
  ['ex_23', 'Curl Martillo', 'Brazo', 'base', 'Braquial', 'Curl con agarre neutro (palmas enfrentadas).', null],
  ['ex_24', 'Press Francés', 'Brazo', 'base', 'Tríceps', 'Extensión de codo tumbado con barra Z.', null],
  ['ex_25', 'Extensiones Tríceps Polea', 'Brazo', 'base', 'Tríceps', 'Empuje hacia abajo con cuerda o barra en polea.', null],
  ['ex_26', 'Fondos en Paralelas', 'Brazo', 'calisthenics', 'Tríceps/Pecho', 'Baja y sube tu cuerpo apoyado en barras.', null],
  ['ex_27', 'Plancha', 'Core', 'base', 'Abdominales', 'Mantén el cuerpo recto apoyado en antebrazos.', null],
  ['ex_28', 'Elevación de Piernas', 'Core', 'calisthenics', 'Abdomen Bajo', 'Eleva las piernas colgado o tumbado.', null],
  ['ex_29', 'Burpees', 'Full Body', 'base', 'General', 'Combinación de flexión, salto y sentadilla.', null],
  ['ex_30', 'Saltos al Cajón', 'Pierna', 'base', 'Explosividad', 'Salta sobre una plataforma elevada.', null],
  ['ex_31', 'Muscle-up', 'Full Body', 'calisthenics', 'Dorsal/Tríceps', 'Dominada explosiva que termina en fondo.', null],
  ['ex_32', 'Zancadas Búlgaras', 'Pierna', 'base', 'Glúteo/Cuádriceps', 'Sentadilla a una pierna con pie trasero elevado.', null],
  ['ex_33', 'Remo con Mancuerna', 'Espalda', 'base', 'Dorsal', 'Remo a una mano apoyado en banco.', null]
];

export const initDatabase = async () => {
  const db = await SQLiteClient.getInstance();

  await db.execAsync('PRAGMA foreign_keys = ON;');

  for (const table of TABLE_DEFINITIONS) {
    await db.execAsync(table);
  }
  const exerciseCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM library_exercises');
  if (exerciseCount?.count === 0) {
    console.log("Sembrando base de datos con 30+ ejercicios...");
    for (const ex of INITIAL_EXERCISES) {
      await db.runAsync(
        'INSERT INTO library_exercises (id, name, category, branch, muscle_group, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ex
      );
    }
  }


  const columnsToAdd = [
    { table: 'workouts', column: 'is_template', type: 'INTEGER DEFAULT 0' },
    { table: 'workouts', column: 'parent_id', type: 'TEXT' },
    { table: 'profiles', column: 'email', type: 'TEXT' },
    { table: 'profiles', column: 'weight', type: 'REAL' },
    { table: 'profiles', column: 'measurement_units', type: "TEXT DEFAULT 'kg'" }
  ];

  for (const col of columnsToAdd) {
    try {
      await db.execAsync(`ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type};`);
    } catch (e) {
    }
  }
};