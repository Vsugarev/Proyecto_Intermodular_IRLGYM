import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity, Modal, Animated, Alert } from 'react-native';
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
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedNodeId, setUnlockedNodeId] = useState<string | null>(null);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const [userStats, skillTree] = await Promise.all([
        SkillService.getUserStats(uid),
        SkillService.getSkillTree(uid)
      ]);

      if (userStats) {
        setStats(userStats);
        const newProgress = SkillService.calculateLevelProgress(userStats.currentXp, userStats.level);
        setProgress(newProgress);
        Animated.timing(progressAnim, {
          toValue: newProgress,
          duration: 1200,
          useNativeDriver: false
        }).start();
      }
      setTree(skillTree);
      setLoading(false);
    }
  };

  const handleNodePress = (node: any) => {
    setSelectedNode(node);
    setModalVisible(true);
  };

  const handleUnlockSkill = async () => {
    if (!selectedNode || !auth.currentUser) return;

    setIsUnlocking(true);
    try {
      const result = await SkillService.unlockSkill(auth.currentUser.uid, selectedNode.id);
      const justUnlockedId = selectedNode.id;
      await loadData();
      setModalVisible(false);
      setUnlockedNodeId(justUnlockedId);
      scaleAnim.setValue(1);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.4, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 50, useNativeDriver: true })
      ]).start(() => setUnlockedNodeId(null));

      if (result && result.effect) {
        // Mostramos el consejo o la confirmación de la nueva rutina
        Alert.alert("Mejora Desbloqueada", result.effect);
      }
    } catch (error) {
      console.error("Error al desbloquear habilidad:", error);
    } finally {
      setIsUnlocking(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const renderNodeModal = () => {
    if (!selectedNode) return null;

    const isLocked = selectedNode.status === 'locked';
    const isCompleted = selectedNode.status === 'completed';

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={[
                styles.modalIconBg,
                isLocked && { backgroundColor: '#2c2c2e' },
                isCompleted && { backgroundColor: '#28a745' }
              ]}>
                <Ionicons
                  name={isCompleted ? 'checkmark-circle' : 'flash'}
                  size={40}
                  color="#fff"
                />
              </View>
              <Text style={styles.modalTitle}>{selectedNode.title}</Text>
              <Text style={styles.modalBranch}>{selectedNode.branch.toUpperCase()}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Ionicons name="star" size={20} color="#ffd700" />
                <View>
                  <Text style={styles.infoLabel}>RECOMPENSA</Text>
                  <Text style={styles.infoValue}>{selectedNode.xpReward} XP</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="shield" size={20} color="#007aff" />
                <View>
                  <Text style={styles.infoLabel}>REQUISITOS</Text>
                  <Text style={styles.infoValue}>
                    {JSON.parse(selectedNode.requirementsJson).level ? `Nivel ${JSON.parse(selectedNode.requirementsJson).level}` : 'Ninguno'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.descriptionText}>
              Desbloquea esta habilidad para potenciar tu entrenamiento y ganar experiencia adicional en la senda de {selectedNode.branch}.
            </Text>

            <View style={styles.modalFooter}>
              {isCompleted ? (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                  <Text style={styles.completedText}>HABILIDAD OBTENIDA</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.unlockButton, isLocked && styles.unlockButtonDisabled]}
                  onPress={handleUnlockSkill}
                  disabled={isLocked || isUnlocking}
                >
                  {isUnlocking ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.unlockButtonText}>
                      {isLocked ? 'BLOQUEADO' : 'DESBLOQUEAR NODO'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderNode = (node: any, isLast: boolean) => {
    const isCompleted = node.status === 'completed';
    const isAvailable = node.status === 'available';
    const isLocked = node.status === 'locked';

    return (
      <View key={node.id} style={styles.nodeWrapper}>
        <View style={styles.nodeContainer}>
          <Animated.View style={node.id === unlockedNodeId ? { transform: [{ scale: scaleAnim }] } : undefined}>
            <TouchableOpacity
              style={[
                styles.skillNode,
                isCompleted && styles.nodeCompleted,
                isAvailable && styles.nodeAvailable,
                isLocked && styles.nodeLocked
              ]}
              onPress={() => handleNodePress(node)}
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
          </Animated.View>
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
              <Animated.View style={[
                styles.progressFill, 
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]} />
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
      {renderNodeModal()}
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
    backgroundColor: '#2c2c2e',
    borderRadius: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  modalIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#007aff',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalBranch: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 5,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    color: '#8e8e93',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  descriptionText: {
    color: '#d1d1d6',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 40,
  },
  modalFooter: {
    alignItems: 'center',
  },
  unlockButton: {
    backgroundColor: '#28a745',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  unlockButtonDisabled: {
    backgroundColor: '#3a3a3c',
    shadowOpacity: 0,
    elevation: 0,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  completedText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '900',
  },
});
