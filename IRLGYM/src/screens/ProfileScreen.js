import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useStats } from '../context/StatsContext'; // <-- IMPORTANTE
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { Colors, BorderRadius } from '../styles/theme';

const AchievementBadge = ({ icon, title, unlocked }) => (
  <View style={[localStyles.badgeContainer, { opacity: unlocked ? 1 : 0.3 }]}>
    <View style={[localStyles.badgeCircle, { backgroundColor: unlocked ? Colors.primary : '#ccc' }]}>
      <Ionicons name={icon} size={28} color="white" />
    </View>
    <Text style={localStyles.badgeText}>{title}</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { stats } = useStats(); // <-- Datos automáticos del contexto
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (e) {
      console.error(e);
    }
  };

  const level = Math.floor(stats.xp / 100) + 1;

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.headerContainer}>
        <View style={localStyles.avatarPlaceholder}>
          <Ionicons name="person" size={50} color={Colors.white} />
        </View>
        <Text style={[globalStyles.title, { marginBottom: 5 }]}>{user?.email?.split('@')[0]}</Text>
        <View style={localStyles.levelBadge}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>NIVEL {level}</Text>
        </View>
      </View>

      <View style={{ padding: 20 }}>
        <View style={localStyles.streakCard}>
          <Ionicons name="flame" size={40} color="#FF9500" />
          <View style={{ marginLeft: 15 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.text }}>{stats.streak} Días</Text>
            <Text style={globalStyles.caption}>Racha de entrenamientos</Text>
          </View>
        </View>

        <View style={[globalStyles.row, { justifyContent: 'space-between', marginTop: 25 }]}>
          <View style={localStyles.statBox}>
            <Text style={localStyles.statNumber}>{stats.xp}</Text>
            <Text style={globalStyles.caption}>XP Total</Text>
          </View>
          <View style={localStyles.statBox}>
            <Text style={localStyles.statNumber}>{level}</Text>
            <Text style={globalStyles.caption}>Rango</Text>
          </View>
        </View>

        <Text style={[globalStyles.subtitle, { marginTop: 30, marginBottom: 15 }]}>Logros</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <AchievementBadge icon="trophy" title="Primer Paso" unlocked={stats.xp >= 10} />
          <AchievementBadge icon="flame" title="Constante" unlocked={stats.streak >= 3} />
          <AchievementBadge icon="barbell" title="Guerrero" unlocked={stats.xp >= 500} />
          <AchievementBadge icon="medal" title="Leyenda" unlocked={stats.xp >= 1000} />
        </View>

        <TouchableOpacity 
          style={[globalStyles.row, { justifyContent: 'center', marginTop: 40, paddingBottom: 30 }]} 
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
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  levelBadge: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20 },
  streakCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5E6', padding: 20, borderRadius: BorderRadius.large, borderWidth: 1, borderColor: '#FF9500' },
  statBox: { backgroundColor: Colors.white, width: '48%', padding: 15, borderRadius: BorderRadius.medium, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  badgeContainer: { alignItems: 'center', width: '45%', marginBottom: 20, backgroundColor: '#f9f9f9', padding: 15, borderRadius: BorderRadius.medium },
  badgeCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: Colors.text }
});

export default ProfileScreen;