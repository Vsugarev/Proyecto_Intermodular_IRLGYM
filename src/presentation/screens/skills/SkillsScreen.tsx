import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { auth } from '../../../infrastructure/config/firebase';
import { SkillService } from '../../../application/service/SkillService';
import { UserStats } from '../../../domain/entities/User';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export const SkillsScreen = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const loadData = async () => {
    if (auth.currentUser) {
      const userStats = await SkillService.getUserStats(auth.currentUser.uid);
      if (userStats) {
        setStats(userStats);
        const p = SkillService.calculateLevelProgress(userStats.currentXp, userStats.level);
        setProgress(p);
      }
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* REQUISITO Skills-01-1: Visualización de nivel actual */}
        <View style={styles.headerCard}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelLabel}>NIVEL</Text>
            <Text style={styles.levelValue}>{stats?.level || 1}</Text>
          </View>
          
          <View style={styles.xpInfo}>
            <View style={styles.xpTextRow}>
              <Text style={styles.xpLabel}>Experiencia Total</Text>
              <Text style={styles.xpValue}>{stats?.currentXp || 0} XP</Text>
            </View>
            
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            
            <Text style={styles.nextLevelText}>
              {Math.round(progress * 100)}% para el siguiente nivel
            </Text>
          </View>
        </View>

        {/* Espacio para el árbol (Skills-01-2) */}
        <View style={styles.placeholderContainer}>
          <Ionicons name="construct-outline" size={48} color="#c7c7cc" />
          <Text style={styles.placeholderText}>Árbol de habilidades en construcción...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  headerCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  levelBadge: {
    backgroundColor: '#28a745',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  levelLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.8,
  },
  levelValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
  },
  xpInfo: {
    flex: 1,
    marginLeft: 20,
  },
  xpTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  xpLabel: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  xpValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#3a3a3c',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  nextLevelText: {
    color: '#8e8e93',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  placeholderContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  placeholderText: {
    marginTop: 12,
    color: '#8e8e93',
    fontSize: 16,
    fontWeight: '600',
  }
});
