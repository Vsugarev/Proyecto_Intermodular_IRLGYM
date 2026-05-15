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
        email,
        avatarUrl: '',
        measurementUnits: 'kg'
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
      const { 
        CloudUserProfileRepository, 
        CloudUserStatsRepository, 
        CloudProgressRepository,
        CloudWorkoutRepository,
        CloudLogRepository,
        ProgressRepository,
        WorkoutRepository,
        LogRepository
      } = require('../../data/repositories/index');
      
      const [cloudProfile, cloudStats, cloudProgress, cloudWorkouts] = await Promise.all([
        CloudUserProfileRepository.findById(uid),
        CloudUserStatsRepository.findByUserId(uid),
        CloudProgressRepository.findAllByUserId(uid),
        CloudWorkoutRepository.findAllByUserId(uid)
      ]);
      
      if (cloudProfile) await UserProfileRepository.save(cloudProfile);
      else await UserProfileRepository.save({ 
        id: uid, 
        username: 'Guerrero', 
        email: 'warrior@irlgym.com', 
        avatarUrl: '', 
        measurementUnits: 'kg' 
      });

      if (cloudStats) await UserStatsRepository.save(cloudStats);

      if (cloudProgress && cloudProgress.length > 0) {
        for (const p of cloudProgress) {
          await ProgressRepository.save(p);
        }
      }

      if (cloudWorkouts && cloudWorkouts.length > 0) {
        for (const w of cloudWorkouts) {
          await WorkoutRepository.save(w);
          const logs = await CloudLogRepository.findByWorkoutId(w.id);
          if (logs && logs.length > 0) {
            for (const l of logs) {
              await LogRepository.save(l);
            }
          }
        }
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

  static async deleteAccount() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const uid = user.uid;
      const { 
        UserProfileRepository, 
        UserStatsRepository, 
        WorkoutRepository, 
        ProgressRepository,
        LogRepository,
        ExerciseRepository
      } = require('../../data/repositories/index');

      // Intentamos borrar la cuenta de Firebase primero ("todo o nada")
      // Si lanza auth/requires-recent-login, abortará sin borrar las rutinas locales
      await user.delete();

      await LogRepository.deleteByUserId(uid);
      await WorkoutRepository.deleteByUserId(uid);
      await ProgressRepository.deleteByUserId(uid);
      await UserStatsRepository.deleteByUserId(uid);
      await UserProfileRepository.delete(uid);

      await ExerciseRepository.clearUserData();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        throw new Error("Por seguridad, Firebase requiere que hayas iniciado sesión RECIENTEMENTE para borrar tu cuenta. Por favor, cierra sesión, vuelve a entrar y prueba de nuevo.");
      }
      throw new Error(`Error: ${error.message || "No se pudo eliminar la cuenta por completo."}`);
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