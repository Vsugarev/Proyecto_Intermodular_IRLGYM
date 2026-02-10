import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { getUserStats } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles'; // Ruta corregida
import { Colors, BorderRadius } from '../styles/theme'; // Ruta corregida

// Componente interno para las medallas
const AchievementBadge = ({ icon, title, unlocked }) => (
  <View style={[localStyles.badgeContainer, { opacity: unlocked ? 1 : 0.3 }]}>
    <View style={[localStyles.badgeCircle, { backgroundColor: unlocked ? Colors.primary : '#ccc' }]}>
      <Ionicons name={icon} size={28} color="white" />
    </View>
    <Text style={localStyles.badgeText}>{title}</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ xp: 0, streak: 0 });
  const user = auth.currentUser;

  const loadData = () => {
    if (user) {
      const data = getUserStats(user.uid);
      setStats(data);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    loadData();
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace('Login');
  };

  const level = Math.floor(stats.xp / 100) + 1;
  const progress = stats.xp % 100;

  const achievements = [
    { id: 1, title: "Iniciado", icon: "fitness", unlocked: stats.xp > 0 },
    { id: 2, title: "Constante", icon: "flame", unlocked: stats.streak >= 3 },
    { id: 3, title: "Guerrero", icon: "shield-checkmark", unlocked: level >= 5 },
    { id: 4, title: "Bestia", icon: "barbell", unlocked: stats.xp >= 1000 },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.white }}>
      {/* Usamos el nuevo estilo modular de headerContainer */}
      <View style={globalStyles.headerContainer}>
        <Ionicons name="person-circle" size={100} color={Colors.primary} />
        <Text style={[globalStyles.subtitle, { marginTop: 10 }]}>{user?.email}</Text>
        <View style={localStyles.levelBadge}>
          <Text style={{ color: Colors.white, fontWeight: 'bold' }}>NIVEL {level}</Text>
        </View>
      </View>

      <View style={{ padding: 25 }}>
        {/* Tarjeta de Racha */}
        <View style={localStyles.streakCard}>
          <Ionicons name="flame" size={35} color="#FF9500" />
          <View style={{ marginLeft: 15 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF9500' }}>
              {stats.streak} {stats.streak === 1 ? 'DÍA' : 'DÍAS'}
            </Text>
            <Text style={globalStyles.caption}>Racha de entrenamientos</Text>
          </View>
        </View>

        {/* Barra de Progreso modularizada */}
        <View style={{ marginTop: 25 }}>
          <Text style={[globalStyles.subtitle, { marginBottom: 10, fontSize: 16 }]}>
            Progreso: {progress}/100 XP
          </Text>
          <View style={globalStyles.progressBg}>
            <View style={[globalStyles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Grid de Logros modularizado */}
        <Text style={[globalStyles.subtitle, { marginTop: 40, marginBottom: 15 }]}>Logros</Text>
        <View style={globalStyles.grid}>
          {achievements.map((ach) => (
            <AchievementBadge key={ach.id} {...ach} />
          ))}
        </View>
        
        <TouchableOpacity 
          style={[globalStyles.row, { justifyContent: 'center', marginTop: 50, paddingBottom: 30 }]} 
          onPress={() => Platform.OS === 'web' ? (confirm("¿Cerrar sesión?") && handleLogout()) : handleLogout()}
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
          <Text style={{ color: Colors.danger, fontWeight: 'bold', marginLeft: 10 }}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Estilos específicos que solo se usan en esta pantalla
const localStyles = StyleSheet.create({
  levelBadge: { 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 20, 
    paddingVertical: 6, 
    borderRadius: 20, 
    marginTop: 10 
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    padding: 20,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  badgeContainer: { 
    alignItems: 'center', 
    width: '45%', 
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: BorderRadius.medium
  },
  badgeCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  badgeText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: Colors.text,
    textAlign: 'center'
  }
});

export default ProfileScreen;