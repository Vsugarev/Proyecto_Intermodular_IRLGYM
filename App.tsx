import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { UserStatsRepository } from './src/data/repositories';
import { UserStats } from './src/domain/entities/User';
import { AuthService } from './src/application/service/AuthService';
import { SQLiteClient } from './src/infrastructure/database/SQLiteClient';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  // 1. Inicializar la DB local al abrir la app
  useEffect(() => {
    const init = async () => {
      try {
        const db = await SQLiteClient.getInstance();
        // Aseguramos que las tablas existan antes de nada
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS user_profiles (id TEXT PRIMARY KEY, username TEXT, avatarUrl TEXT);
          CREATE TABLE IF NOT EXISTS user_stats (userId TEXT PRIMARY KEY, currentXp INTEGER, level INTEGER, streakCount INTEGER, lastWorkoutDate TEXT);
        `);
        console.log("🛠️ SQLite de IRLGYM listo");
      } catch (e) {
        console.error("Error inicializando DB local", e);
      }
    };
    init();
  }, []);

  const loadStats = async (uid: string) => {
    try {
      const data = await UserStatsRepository.findByUserId(uid);
      setStats(data);
    } catch (e) {
      console.warn("No se pudieron cargar stats locales");
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !username) {
      Alert.alert("Error", "Rellena todos los campos");
      return;
    }
    setLoading(true);
    try {
      const u = await AuthService.register(email, password, username);
      setUser(u);
      await loadStats(u.uid);
      Alert.alert("Éxito", "Usuario creado correctamente");
    } catch (err: any) {
      Alert.alert("Error de Registro", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email y contraseña requeridos");
      return;
    }
    setLoading(true);
    try {
      const u = await AuthService.login(email, password);
      setUser(u);
      await loadStats(u.uid);
      Alert.alert("Bienvenido", "Sesión iniciada");
    } catch (err: any) {
      Alert.alert("Error de Acceso", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#0000ff" /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!user ? (
        <View style={styles.form}>
          <Text style={styles.title}>IRLGYM - Auth</Text>
          <TextInput placeholder="Username (solo registro)" style={styles.input} onChangeText={setUsername} value={username} />
          <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} value={email} autoCapitalize="none" keyboardType="email-address" />
          <TextInput placeholder="Password" style={styles.input} onChangeText={setPassword} value={password} secureTextEntry />
          <Button title="Registrarse" onPress={handleRegister} color="#28a745" />
          <View style={{ marginVertical: 10 }} />
          <Button title="Iniciar Sesión" onPress={handleLogin} color="#007AFF" />
        </View>
      ) : (
        <View style={styles.profile}>
          <Text style={styles.title}>¡Hola, {username || 'Guerrero'}!</Text>
          <Text style={styles.subtitle}>ID: {user.uid}</Text>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Stats (Híbridas):</Text>
            <Text>Nivel: {stats?.level ?? 1}</Text>
            <Text>XP: {stats?.currentXp ?? 0}</Text>
            <Text>Racha: {stats?.streakCount ?? 0} días</Text>
          </View>
          
          <Button title="Cerrar Sesión" onPress={() => setUser(null)} color="red" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  form: { width: '100%' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 15, borderRadius: 8, fontSize: 16 },
  profile: { alignItems: 'center', width: '100%' },
  statsCard: { backgroundColor: '#f8f9fa', padding: 20, borderRadius: 15, marginVertical: 20, width: '90%', borderWidth: 1, borderColor: '#eee' },
  statsTitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 18, color: '#444' }
});