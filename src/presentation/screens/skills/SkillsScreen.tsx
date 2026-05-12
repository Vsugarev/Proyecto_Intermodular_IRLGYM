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
        Alert.alert("Mejora Desbloqueada", result.effect);
      }
    } catch (error: any) {
      console.error("Error al desbloquear habilidad:", error);
      Alert.alert("Requisitos insuficientes", error.message || "No se pudo desbloquear la habilidad.");
    } finally {
      setIsUnlocking(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const renderRequirementItem = (item: any, index: number) => (
    <View key={index} style={styles.reqItem}>
      <View style={[styles.reqDot, item.met ? styles.reqDotMet : styles.reqDotLocked]}>
        <Ionicons name={item.met ? "checkmark" : "lock-closed"} size={12} color="#fff" />
      </View>
      <View style={styles.reqTextContainer}>
        <Text style={styles.reqLabel}>{item.label}</Text>
        <Text style={[styles.reqValue, item.met ? styles.reqValueMet : styles.reqValueLocked]}>
          {item.current} / {item.required}
        </Text>
      </View>
    </View>
  );

  const renderNodeModal = () => {
    if (!selectedNode) return null;

    const isLocked = selectedNode.status === 'locked';
    const isCompleted = selectedNode.status === 'completed';
    const isPending = selectedNode.status === 'requirements_pending';
    const isAvailable = selectedNode.status === 'available';

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={[
                styles.modalIconBg,
                isCompleted && styles.bgSuccess,
                isAvailable && styles.bgPrimary,
                isPending && styles.bgWarning,
                isLocked && styles.bgLocked
              ]}>
                <Ionicons
                  name={isCompleted ? 'checkmark-circle' : (isLocked ? 'lock-closed' : 'flash')}
                  size={40}
                  color="#fff"
                />
              </View>
              <Text style={styles.modalTitle}>{selectedNode.title}</Text>
              <View style={[styles.statusBadge, isCompleted && styles.badgeSuccess, isPending && styles.badgeWarning, isLocked && styles.badgeLocked]}>
                <Text style={styles.statusBadgeText}>
                  {isCompleted ? 'COMPLETADO' : isLocked ? 'PRE-REQUISITO NECESARIO' : isPending ? 'FALTAN REQUISITOS' : 'DISPONIBLE'}
                </Text>
              </View>
            </View>

            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>REQUISITOS DE ACCESO</Text>
              <View style={styles.reqList}>
                {selectedNode.requirementDetails && selectedNode.requirementDetails.length > 0 ? (
                  selectedNode.requirementDetails.map(renderRequirementItem)
                ) : (
                  <View style={styles.reqItem}>
                    <View style={[styles.reqDot, styles.reqDotMet]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                    <Text style={styles.reqLabel}>Sin requisitos especiales</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.rewardCard}>
              <View style={styles.rewardIconBg}>
                <Ionicons name="gift" size={24} color="#ffd700" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>RECOMPENSA</Text>
                <Text style={styles.rewardValue}>+{selectedNode.xpReward} XP {selectedNode.rewardDetail ? `+ ${selectedNode.rewardDetail}` : ''}</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              {isCompleted ? (
                <View style={styles.fullBadge}>
                  <Ionicons name="ribbon" size={20} color="#28a745" />
                  <Text style={styles.fullBadgeText}>MAESTRÍA OBTENIDA</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.unlockButton, !isAvailable && styles.unlockButtonDisabled]}
                  onPress={handleUnlockSkill}
                  disabled={!isAvailable || isUnlocking}
                >
                  {isUnlocking ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.unlockButtonText}>
                      {isAvailable ? 'DESBLOQUEAR AHORA' : (isLocked ? 'BLOQUEADO' : 'CUMPLE REQUISITOS')}
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
    const isPending = node.status === 'requirements_pending';
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
                isPending && styles.nodePending,
                isLocked && styles.nodeLocked
              ]}
              onPress={() => handleNodePress(node)}
              disabled={isLocked && !isPending}
            >
              <View style={[styles.innerCircle, (isLocked || isPending) && { backgroundColor: '#2c2c2e' }]}>
                <Ionicons
                  name={isCompleted ? 'checkmark' : (isLocked ? 'lock-closed' : 'flash')}
                  size={24}
                  color={isLocked ? '#48484a' : (isPending ? '#ffd700' : '#fff')}
                />
              </View>

              <View style={styles.nodeLabelContainer}>
                <Text style={[styles.nodeTitle, isLocked && { color: '#8e8e93' }]}>{node.title}</Text>
                <Text style={[styles.nodeXp, isPending && { color: '#ffd700' }]}>
                  {isCompleted ? 'Dominado' : (isPending ? 'Requisitos pendientes' : `${node.xpReward} XP`)}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {!isLast && (
          <View style={[
            styles.connectorLine, 
            isCompleted && styles.lineActive,
            isAvailable && styles.lineAvailable
          ]} />
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.levelHeader}>
          <View style={styles.statsRow}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>NIVEL ACTUAL</Text>
              <Text style={styles.levelText}>{stats?.level || 1}</Text>
            </View>
            <View style={styles.xpBox}>
              <Ionicons name="sparkles" size={16} color="#ffd700" />
              <Text style={styles.xpText}>{stats?.currentXp || 0} XP</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
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

        <View style={styles.treeContainer}>
          {[
            { id: 'base', icon: 'fitness', label: 'Senda de la Fuerza' },
            { id: 'calisthenics', icon: 'body', label: 'Senda del Control' },
            { id: 'hypertrophy', icon: 'flame', label: 'Senda de la Estética' }
          ].map((branch, idx, arr) => (
            <React.Fragment key={branch.id}>
              {renderBranch(branch.id, branch.icon, branch.label)}
              {idx < arr.length - 1 && <View style={styles.branchDivider} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
      {renderNodeModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  levelHeader: {
    backgroundColor: '#1c1c1e',
    borderRadius: 25,
    padding: 25,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  levelText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
  },
  xpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  xpText: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#3a3a3c',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
  },
  progressPercent: {
    color: '#28a745',
    fontWeight: '900',
    fontSize: 14,
  },
  treeContainer: {
    paddingBottom: 50,
  },
  branchSection: {
    marginBottom: 40,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 35,
    gap: 15,
  },
  branchIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  branchTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  treePath: {
    alignItems: 'center',
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
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 4,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#3a3a3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nodeCompleted: { backgroundColor: '#28a745', shadowColor: '#28a745', shadowRadius: 15 },
  nodeAvailable: { backgroundColor: '#007aff', shadowColor: '#007aff', shadowRadius: 15 },
  nodePending: { backgroundColor: '#ff9500', shadowColor: '#ff9500', shadowRadius: 10 },
  nodeLocked: { backgroundColor: '#1c1c1e', opacity: 0.6 },
  nodeLabelContainer: {
    position: 'absolute',
    left: 100,
    width: 180,
  },
  nodeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  nodeXp: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  connectorLine: {
    width: 6,
    height: 45,
    backgroundColor: '#1c1c1e',
  },
  lineActive: { backgroundColor: '#28a745' },
  lineAvailable: { backgroundColor: '#007aff' },
  branchDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#3a3a3c',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    right: 25,
    top: 25,
    zIndex: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modalIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bgSuccess: { backgroundColor: '#28a745', shadowColor: '#28a745', shadowOpacity: 0.5, shadowRadius: 20 },
  bgPrimary: { backgroundColor: '#007aff', shadowColor: '#007aff', shadowOpacity: 0.5, shadowRadius: 20 },
  bgWarning: { backgroundColor: '#ff9500', shadowColor: '#ff9500', shadowOpacity: 0.5, shadowRadius: 15 },
  bgLocked: { backgroundColor: '#3a3a3c' },
  modalTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#007aff',
  },
  badgeSuccess: { backgroundColor: '#28a745' },
  badgeWarning: { backgroundColor: '#ff9500' },
  badgeLocked: { backgroundColor: '#3a3a3c' },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  requirementsSection: {
    backgroundColor: '#2c2c2e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 15,
    letterSpacing: 1,
  },
  reqList: {
    gap: 12,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reqDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reqDotMet: { backgroundColor: '#28a745' },
  reqDotLocked: { backgroundColor: '#48484a' },
  reqTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqLabel: {
    color: '#d1d1d6',
    fontSize: 14,
    fontWeight: '600',
  },
  reqValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  reqValueMet: { color: '#28a745' },
  reqValueLocked: { color: '#ff453a' },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    gap: 15,
    marginBottom: 30,
  },
  rewardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardTitle: {
    color: '#ffd700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rewardValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalFooter: {
    marginTop: 10,
  },
  unlockButton: {
    backgroundColor: '#007aff',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007aff',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  unlockButtonDisabled: {
    backgroundColor: '#3a3a3c',
    shadowOpacity: 0,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 60,
  },
  fullBadgeText: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
