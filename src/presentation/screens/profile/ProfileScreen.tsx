import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity } from 'react-native';
import { UserStatsRepository } from '../../../data/repositories/index';
import { AuthService } from '../../../application/service/AuthService';
import { UserStats } from '../../../domain/entities/User';
import { auth } from '../../../infrastructure/config/firebase';

export const ProfileScreen = () => {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (auth.currentUser) {
        const data = await UserStatsRepository.findByUserId(auth.currentUser.uid);
        setStats(data);
      }
    };
    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>{auth.currentUser?.email}</Text>
        <Text style={styles.levelLabel}>Nivel {stats?.level ?? 1}</Text>
      </View>

      <Text style={styles.sectionTitle}>Árbol de Habilidades (Prototipo)</Text>
      <View style={styles.skillTree}>
        <SkillNode label="Fuerza" levelRequired={1} currentLevel={stats?.level ?? 1} />
        <SkillNode label="Resistencia" levelRequired={5} currentLevel={stats?.level ?? 1} />
        <SkillNode label="Poder Real" levelRequired={10} currentLevel={stats?.level ?? 1} />
      </View>

      <View style={styles.footer}>
        <Button title="Cerrar Sesión" color="red" onPress={() => AuthService.logout()} />
      </View>
    </ScrollView>
  );
};

const SkillNode = ({ label, levelRequired, currentLevel }: any) => {
  const isUnlocked = currentLevel >= levelRequired;
  return (
    <View style={[styles.node, { opacity: isUnlocked ? 1 : 0.4 }]}>
      <Text style={styles.nodeText}>{label}</Text>
      <Text style={styles.nodeSub}>{isUnlocked ? "✅ Desbloqueado" : `Bloqueado (Nv. ${levelRequired})`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: { padding: 30, backgroundColor: '#1a1a1a', alignItems: 'center' },
  username: { color: 'white', fontSize: 18 },
  levelLabel: { color: '#28a745', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { padding: 20, fontSize: 20, fontWeight: 'bold' },
  skillTree: { padding: 10, alignItems: 'center' },
  node: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', marginBottom: 15, elevation: 3 },
  nodeText: { fontSize: 18, fontWeight: 'bold' },
  nodeSub: { fontSize: 12, color: '#666' },
  footer: { padding: 20, marginBottom: 40 }
});