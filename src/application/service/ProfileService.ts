import * as SQLite from 'expo-sqlite';

export const ProfileService = {

  async ensureProfileExists(uid: string, email: string) {
    try {
      const db = await SQLite.openDatabaseAsync('gym_rpg.db');
      await db.execAsync(`
        INSERT OR IGNORE INTO profiles (id, username) 
        VALUES ('${uid}', '${email || 'Guerrero'}');
      `);
    } catch (error) {
      console.error("Error en ProfileService.ensureProfileExists:", error);
      throw error;
    }
  }
};