import * as SQLite from 'expo-sqlite';

export class SQLiteClient {
  private static instance: SQLite.SQLiteDatabase | null = null;

  static async getInstance(): Promise<SQLite.SQLiteDatabase> {
    if (!this.instance) {
      this.instance = await SQLite.openDatabaseAsync('gym_rpg.db');
    }
    return this.instance;
  }
}