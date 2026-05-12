import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity, Modal, Animated, Alert, Platform, StatusBar } from 'react-native';
import { auth } from '../../../infrastructure/config/firebase';
import { SkillService } from '../../../application/service/SkillService';
import { UserStats } from '../../../domain/entities/User';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Theme } from '../../styles/theme';

type BranchId = 'base' | 'calisthenics' | 'hypertrophy';

export const SkillsScreen = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [activeBranch, setActiveBranch] = useState<BranchId>('base');
  
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

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
          duration: 1000,
          useNativeDriver: false
        }).start();
      }
      setTree(skillTree);
      setLoading(false);
    }
  };

  const switchBranch = (branchId: BranchId) => {
    if (branchId === activeBranch) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setActiveBranch(branchId);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const handleUnlockSkill = async () => {
    if (!selectedNode || !auth.currentUser) return;
    setIsUnlocking(true);
    try {
      const result = await SkillService.unlockSkill(auth.currentUser.uid, selectedNode.id);
      await loadData();
      setModalVisible(false);
      Alert.alert("Mejora Desbloqueada", result?.effect || "Nueva habilidad obtenida");
    } catch (error: any) {
      Alert.alert("Requisitos insuficientes", error.message || "No se pudo desbloquear.");
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
          {item.current}/{item.required}{item.unit || ''}
        </Text>
      </View>
    </View>
  );

  const renderNode = (node: any, isLast: boolean) => {
    const isCompleted = node.status === 'completed';
    const isAvailable = node.status === 'available';
    const isPending = node.status === 'requirements_pending';
    const isLocked = node.status === 'locked';

    return (
      <View key={node.id} style={styles.nodeWrapper}>
        <TouchableOpacity
          style={[
            styles.skillNode,
            isCompleted && styles.nodeCompleted,
            isAvailable && styles.nodeAvailable,
            isPending && styles.nodePending,
            isLocked && styles.nodeLocked
          ]}
          onPress={() => {
            setSelectedNode(node);
            setModalVisible(true);
          }}
          disabled={isLocked && !isPending}
        >
          <View style={[styles.innerCircle, (isLocked || isPending) && { backgroundColor: Theme.colors.cardLight }]}>
            <Ionicons
              name={isCompleted ? 'checkmark' : (isLocked ? 'lock-closed' : 'flash')}
              size={24}
              color={isLocked ? '#48484a' : (isPending ? Theme.colors.accent : '#fff')}
            />
          </View>
          <View style={styles.nodeLabelContainer}>
            <Text style={[styles.nodeTitle, isLocked && { color: Theme.colors.textSecondary }]}>{node.title}</Text>
            <Text style={[styles.nodeXp, isPending && { color: Theme.colors.accent }]}>
              {isCompleted ? 'Dominado' : (isPending ? 'REQUISITOS' : `+${node.xpReward} XP`)}
            </Text>
          </View>
        </TouchableOpacity>
        {!isLast && (
          <View style={[styles.connectorLine, isCompleted && styles.lineActive, isAvailable && styles.lineAvailable]} />
        )}
      </View>
    );
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Theme.colors.success} />
    </View>
  );

  const branches = [
    { id: 'base' as const, icon: 'fitness', label: 'FUERZA' },
    { id: 'calisthenics' as const, icon: 'body', label: 'CALISTENIA' },
    { id: 'hypertrophy' as const, icon: 'flame', label: 'ESTÉTICA' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.levelHeader}>
          <View style={styles.levelMain}>
            <Text style={styles.levelText}>LVL {stats?.level || 1}</Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>{stats?.currentXp || 0} XP</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>

        <View style={styles.branchTabs}>
          {branches.map(b => (
            <TouchableOpacity 
              key={b.id} 
              style={[styles.tab, activeBranch === b.id && styles.activeTab]} 
              onPress={() => switchBranch(b.id)}
            >
              <Ionicons name={b.icon as any} size={20} color={activeBranch === b.id ? '#fff' : Theme.colors.textSecondary} />
              <Text style={[styles.tabLabel, activeBranch === b.id && styles.activeTabLabel]}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Animated.View style={[styles.treeContent, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.treePath}>
            {tree.filter(n => n.branch === activeBranch).map((node, idx, arr) => renderNode(node, idx === arr.length - 1))}
          </View>
        </ScrollView>
      </Animated.View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBg, selectedNode?.status === 'completed' && styles.bgSuccess, selectedNode?.status === 'available' && styles.bgPrimary, selectedNode?.status === 'requirements_pending' && styles.bgWarning, selectedNode?.status === 'locked' && styles.bgLocked]}>
                <Ionicons name={selectedNode?.status === 'completed' ? 'checkmark' : (selectedNode?.status === 'locked' ? 'lock-closed' : 'flash')} size={40} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>{selectedNode?.title}</Text>
              <View style={[styles.statusBadge, selectedNode?.status === 'completed' && styles.badgeSuccess, selectedNode?.status === 'requirements_pending' && styles.badgeWarning, selectedNode?.status === 'locked' && styles.badgeLocked]}>
                <Text style={styles.statusBadgeText}>{selectedNode?.status?.toUpperCase().replace('_', ' ')}</Text>
              </View>
            </View>

            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>REQUISITOS</Text>
              <View style={styles.reqList}>
                {selectedNode?.requirementDetails?.map(renderRequirementItem)}
              </View>
            </View>

            <View style={styles.rewardCard}>
              <View style={styles.rewardIconBg}><Ionicons name="gift" size={24} color={Theme.colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>RECOMPENSA</Text>
                <Text style={styles.rewardValue}>+{selectedNode?.xpReward} XP {selectedNode?.rewardDetail ? `+ ${selectedNode.rewardDetail}` : ''}</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.unlockButton, selectedNode?.status !== 'available' && styles.unlockButtonDisabled]} onPress={handleUnlockSkill} disabled={selectedNode?.status !== 'available' || isUnlocking}>
              {isUnlocking ? <ActivityIndicator color="#fff" /> : <Text style={styles.unlockButtonText}>{selectedNode?.status === 'completed' ? 'DOMINADO' : (selectedNode?.status === 'available' ? 'DESBLOQUEAR' : 'BLOQUEADO')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  topHeader: { backgroundColor: Theme.colors.card, padding: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  levelHeader: { marginBottom: Theme.spacing.md },
  levelMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  levelText: { ...Theme.typography.h1, fontSize: 28 },
  xpBadge: { backgroundColor: Theme.colors.cardLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: Theme.roundness.full },
  xpText: { color: Theme.colors.accent, fontWeight: '800', fontSize: 12 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 6, backgroundColor: Theme.colors.cardLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Theme.colors.success },
  progressPercent: { color: Theme.colors.success, fontWeight: '900', fontSize: 12 },
  branchTabs: { flexDirection: 'row', gap: 10, marginTop: 5 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: Theme.roundness.md, backgroundColor: Theme.colors.cardLight, borderWidth: 1, borderColor: 'transparent' },
  activeTab: { backgroundColor: Theme.colors.primary, borderColor: 'rgba(255,255,255,0.1)' },
  tabLabel: { color: Theme.colors.textSecondary, fontSize: 10, fontWeight: '900' },
  activeTabLabel: { color: '#fff' },
  treeContent: { flex: 1 },
  scrollContent: { paddingVertical: 40, alignItems: 'center' },
  treePath: { alignItems: 'center', width: '100%' },
  nodeWrapper: { alignItems: 'center', width: '100%' },
  skillNode: { width: 280, flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.card, padding: 12, borderRadius: Theme.roundness.lg, borderWidth: 1, borderColor: Theme.colors.border, ...Theme.shadows.medium },
  innerCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Theme.colors.cardLight, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nodeCompleted: { borderColor: Theme.colors.success, backgroundColor: 'rgba(40,167,69,0.1)' },
  nodeAvailable: { borderColor: Theme.colors.primary, backgroundColor: 'rgba(0,122,255,0.1)' },
  nodePending: { borderColor: Theme.colors.warning, backgroundColor: 'rgba(255,149,0,0.1)' },
  nodeLocked: { opacity: 0.5 },
  nodeLabelContainer: { flex: 1 },
  nodeTitle: { ...Theme.typography.h3, fontSize: 15, marginBottom: 2 },
  nodeXp: { ...Theme.typography.caption, fontSize: 10, fontWeight: '800' },
  connectorLine: { width: 3, height: 35, backgroundColor: Theme.colors.border },
  lineActive: { backgroundColor: Theme.colors.success },
  lineAvailable: { backgroundColor: Theme.colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Theme.colors.card, borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: Theme.spacing.lg, paddingBottom: 40 },
  modalHandle: { width: 40, height: 5, backgroundColor: Theme.colors.cardLight, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  closeButton: { position: 'absolute', right: 25, top: 25 },
  modalHeader: { alignItems: 'center', marginBottom: 30 },
  modalIconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  bgSuccess: { backgroundColor: Theme.colors.success },
  bgPrimary: { backgroundColor: Theme.colors.primary },
  bgWarning: { backgroundColor: Theme.colors.warning },
  bgLocked: { backgroundColor: Theme.colors.cardLight },
  modalTitle: { ...Theme.typography.h1, fontSize: 24, textAlign: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  badgeSuccess: { backgroundColor: Theme.colors.success },
  badgeWarning: { backgroundColor: Theme.colors.warning },
  badgeLocked: { backgroundColor: Theme.colors.cardLight },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  requirementsSection: { backgroundColor: Theme.colors.cardLight, borderRadius: Theme.roundness.md, padding: 15, marginBottom: 20 },
  sectionTitle: { ...Theme.typography.caption, fontWeight: '900', marginBottom: 12 },
  reqList: { gap: 10 },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reqDot: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  reqDotMet: { backgroundColor: Theme.colors.success },
  reqDotLocked: { backgroundColor: '#48484a' },
  reqTextContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  reqLabel: { color: Theme.colors.textTertiary, fontSize: 13, fontWeight: '600' },
  reqValue: { fontSize: 13, fontWeight: '800' },
  reqValueMet: { color: Theme.colors.success },
  reqValueLocked: { color: Theme.colors.danger },
  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.05)', padding: 15, borderRadius: Theme.roundness.md, gap: 15, marginBottom: 25 },
  rewardIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
  rewardTitle: { color: Theme.colors.accent, fontSize: 9, fontWeight: '900' },
  rewardValue: { ...Theme.typography.body, fontSize: 14, fontWeight: '800' },
  unlockButton: { backgroundColor: Theme.colors.primary, height: 55, borderRadius: Theme.roundness.md, justifyContent: 'center', alignItems: 'center' },
  unlockButtonDisabled: { backgroundColor: Theme.colors.cardLight },
  unlockButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
