import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { UserStatsRepository, UserProfileRepository } from '../../../data/repositories/index';
import { AuthService } from '../../../application/service/AuthService';
import { UserStats, UserProfile } from '../../../domain/entities/User';
import { auth } from '../../../infrastructure/config/firebase';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [weight, setWeight] = useState('');
  const [units, setUnits] = useState<'kg' | 'lb'>('kg');

  const fetchData = async () => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const [statsData, profileData] = await Promise.all([
        UserStatsRepository.findByUserId(uid),
        UserProfileRepository.findById(uid)
      ]);
      
      setStats(statsData);
      setProfile(profileData);
      
      if (profileData) {
        setUsername(profileData.username);
        setWeight(profileData.weight?.toString() || '');
        setUnits(profileData.measurementUnits || 'kg');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProfile = async () => {
    if (!profile) return;
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        username,
        weight: parseFloat(weight) || undefined,
        measurementUnits: units
      };
      
      await UserProfileRepository.update(updatedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar el perfil");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#28a745" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.email}>{auth.currentUser?.email}</Text>
        <Text style={styles.levelLabel}>Nivel {stats?.level ?? 1}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editBtnText}>{isEditing ? 'Cancelar' : 'Editar'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Nombre de usuario</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Nombre de usuario"
            />

            <Text style={styles.label}>Peso actual ({units})</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="Ej: 75"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Unidades</Text>
            <View style={styles.unitsContainer}>
              {(['kg', 'lb'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, units === u && styles.activeUnitChip]}
                  onPress={() => setUnits(u)}
                >
                  <Text style={[styles.unitText, units === u && styles.activeUnitText]}>
                    {u.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
              <Text style={styles.saveBtnText}>GUARDAR CAMBIOS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Usuario</Text>
              <Text style={styles.infoValue}>{profile?.username || 'Sin nombre'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Peso</Text>
              <Text style={styles.infoValue}>
                {profile?.weight ? `${profile.weight} ${profile.measurementUnits}` : '--'}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Progreso</Text>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.streakCount ?? 0}</Text>
            <Text style={styles.statLabel}>Racha Días</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.currentXp ?? 0}</Text>
            <Text style={styles.statLabel}>XP Total</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => AuthService.logout()}>
          <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: { padding: 40, backgroundColor: '#1c1c1e', alignItems: 'center' },
  avatarContainer: { marginBottom: 15 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: '#3a3a3c', justifyContent: 'center', alignItems: 'center' 
  },
  email: { color: '#8e8e93', fontSize: 14, marginBottom: 5 },
  levelLabel: { color: '#28a745', fontSize: 32, fontWeight: '800' },
  content: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1c1c1e' },
  editBtnText: { color: '#007aff', fontWeight: '600' },
  infoGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  infoCard: { 
    flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  infoLabel: { fontSize: 12, color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1c1c1e' },
  statsCard: { 
    backgroundColor: '#fff', padding: 20, borderRadius: 16, flexDirection: 'row', 
    alignItems: 'center', marginTop: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1c1c1e' },
  statLabel: { fontSize: 12, color: '#8e8e93', fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: '#f2f2f7' },
  editForm: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 25 },
  label: { fontSize: 12, color: '#8e8e93', fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, marginTop: 15 },
  input: { 
    backgroundColor: '#f2f2f7', padding: 12, borderRadius: 10, 
    fontSize: 16, color: '#1c1c1e' 
  },
  unitsContainer: { flexDirection: 'row', gap: 10, marginTop: 5 },
  unitChip: { 
    flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#f2f2f7', alignItems: 'center' 
  },
  activeUnitChip: { backgroundColor: '#28a745' },
  unitText: { fontWeight: '700', color: '#8e8e93' },
  activeUnitText: { color: '#fff' },
  saveBtn: { 
    backgroundColor: '#28a745', padding: 15, borderRadius: 12, 
    alignItems: 'center', marginTop: 25 
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  footer: { padding: 20, alignItems: 'center', marginBottom: 40 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutText: { color: '#ff3b30', fontWeight: '700', fontSize: 16 }
});