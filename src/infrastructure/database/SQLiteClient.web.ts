// Mock de SQLite para la versión web
// Esto evita que expo-sqlite intente cargarse en el navegador, 
// solucionando errores de bundling y WASM.

export class SQLiteClient {
  private static instance: any = null;

  static async getInstance(): Promise<any> {
    if (this.instance) return this.instance;

    // Retornamos un objeto mock que simule la interfaz de la base de datos
    // pero que no haga nada, ya que en web usamos Firebase exclusivamente.
    this.instance = {
      execAsync: async () => {},
      runAsync: async () => ({ lastInsertRowId: 0, changes: 0 }),
      getFirstAsync: async () => null,
      getAllAsync: async () => [],
      withTransactionAsync: async (callback: any) => await callback(),
    };

    return this.instance;
  }
}
