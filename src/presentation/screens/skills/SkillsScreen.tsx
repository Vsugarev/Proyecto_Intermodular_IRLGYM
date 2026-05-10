import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { auth } from '../../../infrastructure/config/firebase';
import { SkillService } from '../../../application/service/SkillService';
import { UserStats } from '../../../domain/entities/User';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export const SkillsScreen = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const loadData = async () => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const [userStats, skillTree] = await Promise.all([
        SkillService.getUserStats(uid),
        SkillService.getSkillTree(uid)
      ]);

      if (userStats) {
        setStats(userStats);
        setProgress(SkillService.calculateLevelProgress(userStats.currentXp, userStats.level));
      }
      setTree(skillTree);
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const renderNode = (node: any, isLast: boolean) => {
    const isCompleted = node.status === 'completed';
    const isAvailable = node.status === 'available';
    const isLocked = node.status === 'locked';

    return (
      <View key={node.id} style={styles.nodeWrapper}>
        <View style={styles.nodeContainer}>
          <TouchableOpacity 
            style={[
              styles.skillNode,
              isCompleted && styles.nodeCompleted,
              isAvailable && styles.nodeAvailable,
              isLocked && styles.nodeLocked
            ]}
            disabled={isLocked}
          >
            <View style={[styles.innerCircle, isLocked && { backgroundColor: '#2c2c2e' }]}>
              <Ionicons 
                name={isCompleted ? 'checkmark' : 'flash'} 
                size={24} 
                color={isLocked ? '#48484a' : '#fff'} 
              />
            </View>
            
            {/* Tooltip / Label */}
            <View style={styles.nodeLabelContainer}>
              <Text style={[styles.nodeTitle, isLocked && { color: '#8e8e93' }]}>{node.title}</Text>
              <Text style={styles.nodeXp}>{node.xpReward} XP</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Línea de conexión si no es el último */}
        {!isLast && (
          <View style={[styles.connectorLine, isCompleted && styles.lineActive]} />
        )}
      </View>
    );
  };

  const renderBranch = (branchName: string, icon: any, label: string) => {
    const nodes = tree.filter(n => n.branch === branchName);
    return (
      <View key={branchName} style={styles.branchSection}>
        <View style={styles.branchHeader}>
          <View style={styles.branchIconBg}>
            <Ionicons name={icon} size={20} color="#fff" />
          </View>
          <Text style={styles.branchTitle}>{label}</Text>
        </View>
        
        <View style={styles.treePath}>
          {nodes.map((node, index) => renderNode(node, index === nodes.length - 1))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.darkOverlay} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header de Nivel (Requirement Skills-01-1) */}
        <View style={styles.levelHeader}>
          <View style={styles.statsRow}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>NIVEL {stats?.level || 1}</Text>
              <Text style={styles.xpDetail}>{stats?.currentXp || 0} XP ACUMULADA</Text>
            </View>
            <Ionicons name="trophy" size={32} color="#ffd700" />
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>

        {/* Árbol de Habilidades (Requirement Skills-01-2) */}
        <View style={styles.treeContainer}>
          {renderBranch('base', 'fitness', 'Senda de la Fuerza')}
          <View style={styles.branchDivider} />
          {renderBranch('calisthenics', 'body', 'Senda del Control')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  levelHeader: {
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelInfo: {
    flex: 1,
  },
  levelText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  xpDetail: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#3a3a3c',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  progressPercent: {
    color: '#28a745',
    fontSize: 12,
    fontWeight: '800',
    width: 35,
  },
  treeContainer: {
    paddingBottom: 40,
  },
  branchSection: {
    marginBottom: 50,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 12,
  },
  branchIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  branchTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  treePath: {
    alignItems: 'center',
    paddingLeft: 20, // Offset para el diseño "Tree"
  },
  nodeWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  skillNode: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: '#3a3a3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nodeCompleted: {
    backgroundColor: '#28a745',
    shadowColor: '#28a745',
    shadowRadius: 15,
    shadowOpacity: 0.6,
  },
  nodeAvailable: {
    backgroundColor: '#007aff',
    shadowColor: '#007aff',
    shadowRadius: 15,
    shadowOpacity: 0.6,
  },
  nodeLocked: {
    backgroundColor: '#1c1c1e',
    opacity: 0.6,
  },
  nodeLabelContainer: {
    position: 'absolute',
    left: 85,
    width: 200,
  },
  nodeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  nodeXp: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '600',
  },
  connectorLine: {
    width: 4,
    height: 40,
    backgroundColor: '#1c1c1e',
  },
  lineActive: {
    backgroundColor: '#28a745',
    shadowColor: '#28a745',
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  branchDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 40,
  }
});
