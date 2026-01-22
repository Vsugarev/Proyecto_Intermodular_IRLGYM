import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { getUserXP } from '../services/database';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const [xp, setXp] = useState(0);
  const user = auth.currentUser;

  const loadData = () => {
    if (user) {
      setXp(getUserXP(user.uid));
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    loadData();
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Quieres salir?", [
      { text: "No" },
      { text: "Sí", onPress: async () => {
          await signOut(auth);
          navigation.replace('Login');
      }}
    ]);
  };

  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={100} color="#007AFF" />
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>NIVEL {level}</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.xpLabel}>Progreso: {progress}/100 XP</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="red" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', padding: 40, backgroundColor: '#f9f9f9' },
  email: { fontSize: 16, color: '#333', marginTop: 10 },
  levelBadge: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  levelText: { color: '#fff', fontWeight: 'bold' },
  statsCard: { padding: 30 },
  xpLabel: { fontWeight: 'bold', marginBottom: 10 },
  barBg: { height: 12, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#4CD964' },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40, padding: 20 },
  logoutText: { color: 'red', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});

export default ProfileScreen;