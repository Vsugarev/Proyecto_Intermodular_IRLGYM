import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../../infrastructure/config/firebase';
import { UserProfileRepository, UserStatsRepository } from '../../data/repositories/index';
import { UserProfile, UserStats } from '../../domain/entities/User';

export class AuthService {
  
  static async register(email: string, pass: string, confirmPass: string, username: string) {
    if (pass !== confirmPass) throw new Error("Las contraseñas no coinciden");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(pass)) {
      throw new Error("La contraseña debe incluir 1 dígito, una minúscula, una mayúscula y un carácter especial");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = userCredential.user.uid;

      const newProfile: UserProfile = { 
        id: uid, 
        username, 
        avatarUrl: '' 
      };
      
      const newStats: UserStats = {
        userId: uid,
        currentXp: 0,
        level: 1,
        streakCount: 0,
        lastWorkoutDate: new Date().toISOString()
      };

      await UserProfileRepository.save(newProfile);
      await UserStatsRepository.save(newStats);

      return userCredential.user;
    } catch (error: any) {
      throw new Error(this.mapError(error.code));
    }
  }

  static async login(email: string, pass: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      await this.syncUserToLocal(userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(this.mapError(error.code));
    }
  }

  static async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(this.mapError(error.code));
    }
  }

  static async syncUserToLocal(uid: string) {
    try {
      // Importación dinámica o uso de los exportados para evitar ciclos si los hubiera
      const { CloudUserProfileRepository, CloudUserStatsRepository } = require('../../data/repositories/index');
      
      const cloudProfile = await CloudUserProfileRepository.findById(uid);
      const cloudStats = await CloudUserStatsRepository.findByUserId(uid);
      
      if (cloudProfile) {
        await UserProfileRepository.save(cloudProfile);
      } else {
        // Si no hay perfil en la nube (ej. primer login tras registro incompleto), creamos uno básico
        await UserProfileRepository.save({ id: uid, username: 'Guerrero', avatarUrl: '' });
      }

      if (cloudStats) {
        await UserStatsRepository.save(cloudStats);
      }
    } catch (e) {
      console.warn("Error de sincronización inicial:", e);
    }
  }

  static async logout() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error("Error al cerrar sesión");
    }
  }

  private static mapError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return 'Este correo ya está registrado.';
      case 'auth/weak-password': return 'La contraseña es demasiado débil.';
      case 'auth/invalid-credential': return 'Email o contraseña incorrectos.';
      case 'auth/user-not-found': return 'No existe una cuenta con este email.';
      case 'auth/wrong-password': return 'Contraseña incorrecta.';
      default: return 'Error de autenticación. Inténtalo de nuevo.';
    }
  }
}