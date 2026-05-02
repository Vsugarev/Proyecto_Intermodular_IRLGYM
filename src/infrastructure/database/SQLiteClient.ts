import * as SQLite from 'expo-sqlite';

export class SQLiteClient {
  private static instance: SQLite.SQLiteDatabase | null = null;
  private static promise: Promise<SQLite.SQLiteDatabase> | null = null;

  static async getInstance(): Promise<SQLite.SQLiteDatabase> {
    if (this.instance) return this.instance;

    if (!this.promise) {
      this.promise = SQLite.openDatabaseAsync('gym_rpg.db').then(db => {
        this.instance = db;
        return db;
      });
    }
    return this.promise;
  }
}