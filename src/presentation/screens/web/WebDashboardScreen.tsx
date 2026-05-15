import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../styles/theme';
import { UserStatsService } from '../../../application/service/UserStatsService';
import { UserProfileService } from '../../../application/service/UserProfileService';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { auth } from '../../../infrastructure/config/firebase';
import { Workout } from '../../../domain/entities/Workout';
import { UserStats, UserProfile } from '../../../domain/entities/User';
import { AuthService } from '../../../application/service/AuthService';

export const WebDashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [userStats, userProfile, workouts] = await Promise.all([
        UserStatsService.getStats(user.uid),
        UserProfileService.getProfile(user.uid),
        WorkoutService.getWorkoutsByUser(user.uid)
      ]);

      setStats(userStats);
      setProfile(userProfile);
      
      const completed = workouts.filter((w: Workout) => w.status === 'completed' && !w.isTemplate);
      completed.sort((a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setRecentWorkouts(completed.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {profile?.username || 'Atleta'}</Text>
          <Text style={styles.subtitle}>Tu resumen de entrenamiento (Modo Web)</Text>
        </View>
        <Ionicons 
          name="log-out-outline" 
          size={28} 
          color={Theme.colors.danger} 
          onPress={handleLogout} 
          style={{ cursor: 'pointer' } as any} 
        />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.card}>
          <Ionicons name="flash" size={32} color={Theme.colors.primary} />
          <Text style={styles.cardValue}>Nivel {stats?.level || 1}</Text>
          <Text style={styles.cardLabel}>{stats?.currentXp || 0} / 1000 XP</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="flame" size={32} color={Theme.colors.danger} />
          <Text style={styles.cardValue}>{stats?.streakCount || 0}</Text>
          <Text style={styles.cardLabel}>Días de Racha</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="barbell" size={32} color={Theme.colors.success} />
          <Text style={styles.cardValue}>{recentWorkouts.length}</Text>
          <Text style={styles.cardLabel}>Entrenamientos (Recientes)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimos Entrenamientos</Text>
        {recentWorkouts.length === 0 ? (
          <Text style={styles.emptyText}>No hay entrenamientos completados aún.</Text>
        ) : (
          recentWorkouts.map((workout) => (
            <View key={workout.id} style={styles.rowCard}>
              <View>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutDate}>{new Date(workout.date).toLocaleDateString()}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={Theme.colors.success} />
            </View>
          ))
        )}
      </View>
      
      <View style={styles.warningBox}>
        <Ionicons name="information-circle-outline" size={24} color={Theme.colors.primary} />
        <Text style={styles.warningText}>
          La versión web es únicamente de consulta. Para iniciar un entrenamiento o editar tu rutina, por favor accede desde la aplicación móvil.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  card: {
    flex: 1,
    minWidth: 200,
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  workoutDate: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  warningText: {
    marginLeft: 12,
    color: Theme.colors.primary,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  }
});
