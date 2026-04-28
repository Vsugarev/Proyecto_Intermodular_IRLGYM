import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth } from '../../infrastructure/config/firebase';
import { UserProfileRepository, UserStatsRepository } from '../../data/repositories/syncManager';
import { UserProfile, UserStats } from '../../domain/entities/User';

export class AuthService {
  
  static async register(email: string, pass: string, username: string) {
    try {
      console.log("Iniciando registro en Firebase Auth...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = userCredential.user.uid;

      const newProfile: UserProfile = { id: uid, username, avatarUrl: '' };
      const newStats: UserStats = {
        userId: uid,
        currentXp: 0,
        level: 1,
        streakCount: 0,
        lastWorkoutDate: new Date().toISOString()
      };

      console.log("Intentando guardar Perfil en Local y Nube...");
      await UserProfileRepository.save(newProfile);
      
      console.log("Intentando guardar Stats en Local y Nube...");
      await UserStatsRepository.save(newStats);

      console.log("¡Registro completado con éxito!");
      return userCredential.user;
    } catch (error: any) {
      console.error("ERROR DETALLADO REGISTRO:", error.code, error.message);
      throw this.mapError(error.code);
    }
  }

  static async login(email: string, pass: string) {
    try {
      console.log("Intentando login...");
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      console.log("Login exitoso. Sincronizando datos...");
      await this.syncUserToLocal(user.uid);

      return user;
    } catch (error: any) {
      console.error("ERROR DETALLADO LOGIN:", error.code, error.message);
      throw this.mapError(error.code);
    }
  }

  private static async syncUserToLocal(uid: string) {
    try {
      const cloudProfile = await UserProfileRepository.findById(uid);
      const cloudStats = await UserStatsRepository.findByUserId(uid);
      
      if (cloudProfile) await UserProfileRepository.save(cloudProfile);
      if (cloudStats) await UserStatsRepository.save(cloudStats);
      
      console.log("Sincronización inicial completada con éxito.");
    } catch (e) {
      console.warn("No se pudo sincronizar la data inicial (posiblemente offline).", e);
    }
  }

  static async logout() {
    try {
      await signOut(auth);
      console.log("Sesión cerrada");
    } catch (e) {
      console.error("Error al cerrar sesión", e);
    }
  }

  private static mapError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return 'Correo ya registrado.';
      case 'auth/invalid-email': return 'Email no válido.';
      case 'auth/weak-password': return 'Contraseña muy corta (mínimo 6 caracteres).';
      case 'auth/user-not-found': 
      case 'auth/wrong-password': 
      case 'auth/invalid-credential': return 'Email o contraseña incorrectos.';
      default: return `Error: ${code}. Revisa tu conexión.`;
    }
  }
}