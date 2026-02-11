import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useStats } from '../context/StatsContext';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { Colors, BorderRadius } from '../styles/theme';
import Badge from '../components/Badge'; // Usamos tu componente existente

const ProfileScreen = ({ navigation }) => {
  const { stats } = useStats(); // Obtenemos XP y Racha del contexto
  const user = auth.currentUser;

  // --- LÓGICA DE NIVEL Y BARRA DE PROGRESO ---
  const level = Math.floor(stats.xp / 100) + 1; //
  const xpInLevel = stats.xp % 100; // XP acumulado en el nivel actual
  const progress = xpInLevel / 100; // Porcentaje para la barra (0.0 a 1.0)

  // --- LÓGICA DE CALENDARIO (DÍAS DE HIERRO) ---
  const weekDays = useMemo(() => {
    const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const today = new Date();
    const currentWeek = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      currentWeek.push({
        dayName: days[d.getDay()],
        date: isoDate,
        isToday: isoDate === today.toISOString().split('T')[0]
      });
    }
    return currentWeek;
  }, [stats.last_train]); // Se refresca si cambia la fecha de último entreno

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (e) { console.error(e); }
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HEADER: Avatar y Nivel */}
      <View style={localStyles.headerContainer}>
        <View style={localStyles.avatarPlaceholder}>
          <Ionicons name="person" size={50} color={Colors.white} />
        </View>
        <Text style={[globalStyles.title, { marginBottom: 5 }]}>
          {user?.email?.split('@')[0]}
        </Text>
        <View style={localStyles.levelBadge}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>NIVEL {level}</Text>
        </View>
      </View>

      <View style={{ padding: 20 }}>
        
        {/* 1. BARRA DE PROGRESO XP */}
        <View style={localStyles.sectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={localStyles.sectionTitle}>Progreso de Nivel</Text>
            <Text style={globalStyles.caption}>{xpInLevel} / 100 XP</Text>
          </View>
          <View style={localStyles.progressBg}>
            <View style={[localStyles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={[globalStyles.caption, { marginTop: 5, textAlign: 'right' }]}>
            Faltan {100 - xpInLevel} XP para el nivel {level + 1}
          </Text>
        </View>

        {/* 2. DÍAS DE HIERRO (CALENDARIO) */}
        <Text style={localStyles.sectionTitle}>Días de Hierro</Text>
        <View style={localStyles.streakCalendar}>
          {weekDays.map((day, index) => {
            const entrenado = stats.last_train === day.date; //
            return (
              <View key={index} style={{ alignItems: 'center' }}>
                <Text style={[globalStyles.caption, day.isToday && { color: Colors.primary, fontWeight: 'bold' }]}>
                  {day.dayName}
                </Text>
                <View style={[
                  localStyles.dayCircle, 
                  entrenado ? { backgroundColor: '#FF9500' } : { backgroundColor: Colors.lightGray },
                  day.isToday && !entrenado && { borderWeight: 2, borderColor: Colors.primary, borderWidth: 1 }
                ]}>
                  {entrenado ? (
                    <Ionicons name="flame" size={18} color="white" />
                  ) : (
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'gray' }} />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 3. ESTADÍSTICAS RÁPIDAS */}
        <View style={[globalStyles.row, { justifyContent: 'space-between', marginTop: 25 }]}>
          <View style={localStyles.statBox}>
            <Text style={localStyles.statNumber}>{stats.streak}</Text>
            <Text style={globalStyles.caption}>Racha actual</Text>
          </View>
          <View style={localStyles.statBox}>
            <Text style={localStyles.statNumber}>{stats.xp}</Text>
            <Text style={globalStyles.caption}>XP Total</Text>
          </View>
        </View>

        {/* 4. LOGROS (Usando tu componente Badge) */}
        <Text style={[localStyles.sectionTitle, { marginTop: 30 }]}>Logros</Text>
        <View style={localStyles.achievementsGrid}>
          <Badge icon="star" title="Novato" unlocked={stats.xp >= 10} />
          <Badge icon="flame" title="Constante" unlocked={stats.streak >= 3} />
          <Badge icon="barbell" title="Guerrero" unlocked={stats.xp >= 500} />
          <Badge icon="trophy" title="Leyenda" unlocked={stats.xp >= 1000} />
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity 
          style={[globalStyles.row, { justifyContent: 'center', marginTop: 40 }]} 
          onPress={() => Platform.OS === 'web' ? (confirm("¿Cerrar sesión?") && handleLogout()) : handleLogout()}
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
          <Text style={{ color: Colors.danger, fontWeight: 'bold', marginLeft: 10 }}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  headerContainer: { alignItems: 'center', marginTop: 10 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  levelBadge: { backgroundColor: Colors.primary, paddingHorizontal: 15, paddingVertical: 4, borderRadius: 20 },
  sectionCard: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  progressBg: { width: '100%', height: 12, backgroundColor: Colors.lightGray, borderRadius: 6, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: Colors.primary },
  streakCalendar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', padding: 15, borderRadius: BorderRadius.medium, elevation: 2 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  statBox: { backgroundColor: Colors.white, width: '48%', padding: 15, borderRadius: BorderRadius.medium, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }
});

export default ProfileScreen;