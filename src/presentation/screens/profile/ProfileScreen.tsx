import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { UserStatsService } from '../../../application/service/UserStatsService';
import { UserProfileService } from '../../../application/service/UserProfileService';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { AuthService } from '../../../application/service/AuthService';
import { UserStats, UserProfile } from '../../../domain/entities/User';
import { Workout } from '../../../domain/entities/Workout';
import { auth } from '../../../infrastructure/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Theme } from '../../styles/theme';

export const ProfileScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [username, setUsername] = useState('');
  const [weight, setWeight] = useState('');
  const [units, setUnits] = useState<'kg' | 'lb'>('kg');

  const handleLogout = async () => {
    Alert.alert("Cerrar Sesión", "¿Quieres salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: async () => await AuthService.logout() }
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "ELIMINAR CUENTA", 
      "Esta acción es irreversible y borrará TODO tu progreso local y en la nube. ¿Estás seguro?", 
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "ELIMINAR TODO", 
          style: "destructive", 
          onPress: async () => {
            try {
              await AuthService.deleteAccount();
            } catch (e: any) {
              if (e.message.includes("RECIENTEMENTE")) {
                Alert.alert("Seguridad de Firebase", e.message, [
                  { text: "Entendido", style: "cancel" },
                  { text: "Cerrar Sesión", onPress: () => AuthService.logout() }
                ]);
              } else {
                Alert.alert("Error", e.message);
              }
            }
          } 
        }
      ]
    );
  };

  const fetchData = async () => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const [statsData, profileData, workoutsData] = await Promise.all([
        UserStatsService.getStats(uid),
        UserProfileService.getProfile(uid),
        WorkoutService.getWorkoutsByUser(uid)
      ]);
      
      setStats(statsData);
      setProfile(profileData);
      
      const completedWorkouts = workoutsData
        .filter((w: any) => w.status === 'completed' && !w.isTemplate)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setWorkouts(completedWorkouts);
      
      if (profileData) {
        setUsername(profileData.username);
        setWeight(profileData.weight?.toString() || '');
        setUnits(profileData.measurementUnits || 'kg');
      }
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const handleUpdateProfile = async () => {
    if (!profile) return;
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        username,
        weight: parseFloat(weight) || undefined,
        measurementUnits: units
      };
      
      await UserProfileService.updateProfile(updatedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      
      if (Platform.OS === 'web') {
        alert("Perfil actualizado correctamente");
      } else {
        Alert.alert("Éxito", "Perfil actualizado correctamente");
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        alert("No se pudo actualizar el perfil");
      } else {
        Alert.alert("Error", "No se pudo actualizar el perfil");
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.success} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={44} color={Theme.colors.textSecondary} />
              </View>
            )}
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>LVL {stats?.level ?? 1}</Text>
            </View>
          </View>
          <Text style={styles.profileUsername}>{profile?.username || 'Guerrero'}</Text>
          <Text style={styles.profileEmail}>{auth.currentUser?.email}</Text>
        </View>

        <View style={styles.statsOverview}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{stats?.streakCount ?? 0}</Text>
            <Text style={styles.overviewLabel}>Racha</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{workouts.length}</Text>
            <Text style={styles.overviewLabel}>Entrenos</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{stats?.currentXp ?? 0}</Text>
            <Text style={styles.overviewLabel}>XP Total</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>INFORMACIÓN</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editActionBtn}>
              <Text style={styles.editActionText}>{isEditing ? 'CANCELAR' : 'EDITAR'}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Apodo</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nombre de usuario"
                  placeholderTextColor={Theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Peso Corporal ({units})</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Ej: 75"
                  keyboardType="numeric"
                  placeholderTextColor={Theme.colors.textSecondary}
                />
              </View>

              <View style={styles.unitsContainer}>
                {(['kg', 'lb'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitTab, units === u && styles.activeUnitTab]}
                    onPress={() => setUnits(u)}
                  >
                    <Text style={[styles.unitTabText, units === u && styles.activeUnitTabText]}>
                      {u.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
                <Text style={styles.saveBtnText}>GUARDAR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>PESO</Text>
                <Text style={styles.infoValue}>
                  {profile?.weight ? `${profile.weight} ${profile.measurementUnits}` : '--'}
                </Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>UNIDADES</Text>
                <Text style={styles.infoValue}>{profile?.measurementUnits?.toUpperCase() || 'KG'}</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>HISTORIAL RECIENTE</Text>
        {workouts.length > 0 ? (
          workouts.slice(0, 5).map((workout) => (
            <TouchableOpacity 
              key={workout.id} 
              style={styles.historyCard}
              onPress={() => navigation.navigate('RoutineDetail', { routineId: workout.id })}
            >
              <View style={styles.historyIconBg}>
                <Ionicons name="checkmark-done" size={20} color={Theme.colors.success} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>{workout.name}</Text>
                <Text style={styles.historyDate}>
                  {new Date(workout.date).toLocaleDateString(undefined, { 
                    day: 'numeric', 
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Theme.colors.cardLight} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Sin entrenamientos registrados</Text>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Theme.colors.danger} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.logoutBtn, { marginTop: 10, borderColor: 'rgba(255,59,48,0.2)' }]} 
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={Theme.colors.danger} />
            <Text style={styles.logoutText}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  scrollContent: { padding: Theme.spacing.md },
  header: { 
    alignItems: 'center', 
    paddingVertical: Theme.spacing.xxl,
    marginTop: Theme.spacing.md
  },
  avatarContainer: { position: 'relative', marginBottom: Theme.spacing.md },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: Theme.colors.border } as any,
  avatarPlaceholder: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: Theme.colors.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Theme.colors.border
  },
  badgeContainer: {
    position: 'absolute', bottom: -5, right: -5,
    backgroundColor: Theme.colors.success,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Theme.roundness.md,
    ...Theme.shadows.medium
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  profileUsername: { ...Theme.typography.h1, fontSize: 28, marginBottom: 4 },
  profileEmail: { ...Theme.typography.caption, fontSize: 14 },

  statsOverview: {
    flexDirection: 'row', 
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.medium,
    borderWidth: 1, borderColor: Theme.colors.border
  },
  overviewCard: { flex: 1, alignItems: 'center' },
  overviewValue: { ...Theme.typography.h2, color: Theme.colors.text },
  overviewLabel: { ...Theme.typography.caption, fontWeight: '700' },
  overviewDivider: { width: 1, height: '80%', backgroundColor: Theme.colors.border },

  section: { marginBottom: Theme.spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md },
  sectionTitle: { ...Theme.typography.caption, fontWeight: '900', letterSpacing: 1, marginBottom: Theme.spacing.sm },
  editActionBtn: { backgroundColor: 'rgba(0,122,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Theme.roundness.sm },
  editActionText: { color: Theme.colors.primary, fontSize: 10, fontWeight: '900' },

  infoRow: { flexDirection: 'row', gap: Theme.spacing.md },
  infoBox: { 
    flex: 1, backgroundColor: Theme.colors.card, 
    padding: Theme.spacing.md, borderRadius: Theme.roundness.lg,
    borderWidth: 1, borderColor: Theme.colors.border
  },
  infoLabel: { ...Theme.typography.caption, fontSize: 10, fontWeight: '800', marginBottom: 4 },
  infoValue: { ...Theme.typography.h3, fontSize: 18 },

  editCard: { backgroundColor: Theme.colors.card, padding: Theme.spacing.lg, borderRadius: Theme.roundness.lg },
  inputGroup: { marginBottom: Theme.spacing.md },
  label: { ...Theme.typography.caption, marginBottom: 8, marginLeft: 4 },
  input: { 
    backgroundColor: Theme.colors.cardLight, padding: 14, borderRadius: Theme.roundness.md, 
    color: Theme.colors.text, fontSize: 16 
  },
  unitsContainer: { flexDirection: 'row', gap: 10, marginTop: 10 },
  unitTab: { 
    flex: 1, padding: 12, borderRadius: Theme.roundness.md, 
    backgroundColor: Theme.colors.cardLight, alignItems: 'center' 
  },
  activeUnitTab: { backgroundColor: Theme.colors.primary },
  unitTabText: { color: Theme.colors.textSecondary, fontWeight: '800' },
  activeUnitTabText: { color: '#fff' },
  saveBtn: { 
    backgroundColor: Theme.colors.success, padding: 16, borderRadius: Theme.roundness.md, 
    alignItems: 'center', marginTop: Theme.spacing.lg, ...Theme.shadows.medium
  },
  saveBtnText: { color: '#fff', fontWeight: '900' },

  historyCard: {
    backgroundColor: Theme.colors.card, padding: Theme.spacing.md,
    borderRadius: Theme.roundness.lg, flexDirection: 'row',
    alignItems: 'center', marginBottom: Theme.spacing.sm,
    borderWidth: 1, borderColor: Theme.colors.border
  },
  historyIconBg: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(40,167,69,0.1)', justifyContent: 'center', alignItems: 'center',
    marginRight: Theme.spacing.md
  },
  historyInfo: { flex: 1 },
  historyName: { ...Theme.typography.h3, fontSize: 15, marginBottom: 2 },
  historyDate: { ...Theme.typography.caption },

  emptyState: { 
    backgroundColor: Theme.colors.card, padding: 40, borderRadius: Theme.roundness.lg,
    alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: Theme.colors.border
  },
  emptyText: { ...Theme.typography.caption },

  footer: { marginTop: Theme.spacing.xxl, marginBottom: 40, alignItems: 'center' },
  logoutBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 15, borderRadius: Theme.roundness.lg,
    backgroundColor: 'rgba(255,69,58,0.05)'
  },
  logoutText: { color: Theme.colors.danger, fontWeight: '800', fontSize: 16 },
});