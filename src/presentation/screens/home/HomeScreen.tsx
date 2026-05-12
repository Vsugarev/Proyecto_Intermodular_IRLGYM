import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, ActivityIndicator, Animated, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { SkillService } from '../../../application/service/SkillService';
import { auth } from '../../../infrastructure/config/firebase';
import { Workout } from '../../../domain/entities/Workout';
import { Theme } from '../../styles/theme';

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [skillProgress, setSkillProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (user) {
        loadAllData(user.uid);
      } else {
        setLoading(false);
      }
    }, [])
  );

  const loadAllData = async (uid: string) => {
    try {
      setLoading(true);
      const [workouts, skills] = await Promise.all([
        WorkoutService.getWorkoutsByUser(uid),
        SkillService.getHomeProgress(uid)
      ]);
      setTemplates(workouts.filter((w: Workout) => w.isTemplate));
      setSkillProgress(skills);
      
      Animated.timing(progressAnim, {
        toValue: skills.overallProgress,
        duration: 1000,
        useNativeDriver: false
      }).start();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const newRoutine = await WorkoutService.createEmptyTemplate(user.uid, "Nueva Rutina");
      navigation.navigate('EditRoutine', { routine: newRoutine });
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo crear");
    }
  };

  const handleStartRoutine = async (routineId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const session = await WorkoutService.duplicateRoutine(routineId, user.uid);
      navigation.navigate('EditRoutine', { routine: session });
    } catch (e) {
      Alert.alert("Error", "No se pudo iniciar");
    }
  };

  const renderSkillWidget = () => {
    if (!skillProgress) return null;
    const { nextNode, completedCount, totalCount } = skillProgress;

    return (
      <TouchableOpacity 
        style={styles.skillWidget} 
        onPress={() => navigation.navigate('Progreso')}
        activeOpacity={0.9}
      >
        <View style={styles.widgetHeader}>
          <View style={styles.widgetTitleRow}>
            <View style={styles.trophyBg}>
              <Ionicons name="trophy" size={18} color={Theme.colors.accent} />
            </View>
            <Text style={styles.widgetTitle}>Progreso de Guerrero</Text>
          </View>
          <Text style={styles.countText}>{completedCount}/{totalCount} Nodos</Text>
        </View>

        <View style={styles.mainProgressContainer}>
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
        </View>

        {nextNode ? (
          <View style={styles.nextSkillCard}>
            <View style={styles.nextInfo}>
              <Text style={styles.nextLabel}>PRÓXIMO OBJETIVO</Text>
              <Text style={styles.nextNodeTitle}>{nextNode.title}</Text>
            </View>
            <View style={styles.reqSummary}>
              {nextNode.requirementDetails?.slice(0, 2).map((req: any, idx: number) => (
                <View key={idx} style={styles.reqMiniRow}>
                  <Ionicons 
                    name={req.met ? "checkmark-circle" : "ellipse-outline"} 
                    size={12} 
                    color={req.met ? Theme.colors.success : Theme.colors.textSecondary} 
                  />
                  <Text style={[styles.reqMiniText, req.met && styles.reqMetText]}>
                    {req.label} ({req.current}/{req.required}{req.unit})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.allDoneText}>¡Máximo nivel alcanzado!</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderRoutineItem = ({ item }: { item: Workout }) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.routineCard} 
      onPress={() => handleStartRoutine(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.routineIconContainer}>
        <Ionicons name="fitness" size={24} color={Theme.colors.primary} />
      </View>

      <View style={styles.routineInfo}>
        <Text style={styles.routineName}>{item.name}</Text>
        <View style={styles.routineMeta}>
          <Ionicons name="time-outline" size={12} color={Theme.colors.textSecondary} />
          <Text style={styles.routineDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </View>
      
      <View style={styles.cardActionRow}>
        {!item.isLocked && (
          <TouchableOpacity 
             style={styles.editBtn} 
             onPress={() => navigation.navigate('EditRoutine', { routine: item })}
          >
            <Ionicons name="settings-outline" size={20} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
        <View style={styles.playBtn}>
          <Ionicons name="play" size={20} color={Theme.colors.text} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const [showRewards, setShowRewards] = useState(false);
  const [isRewardsHidden, setIsRewardsHidden] = useState(false);
  const rewardRoutines = templates.filter((w: any) => w.isLocked);
  const userTemplates = templates.filter((w: any) => !w.isLocked);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Panel Principal</Text>
            <Text style={styles.title}>IRLGYM <Text style={{color: Theme.colors.success}}>WARRIOR</Text></Text>
          </View>
          <TouchableOpacity style={styles.profileIcon}>
            <Ionicons name="person-circle" size={44} color={Theme.colors.cardLight} />
          </TouchableOpacity>
        </View>
        
        {loading && <ActivityIndicator style={{ marginBottom: 20 }} color={Theme.colors.success} />}

        <FlatList
          data={[]} 
          renderItem={null}
          ListHeaderComponent={
            <>
              {renderSkillWidget()}

              {rewardRoutines.length > 0 && !isRewardsHidden && (
                <View style={styles.rewardSection}>
                  <View style={styles.rewardAccordionHeader}>
                    <TouchableOpacity 
                      style={styles.rewardTitleRow} 
                      onPress={() => setShowRewards(!showRewards)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="ribbon" size={20} color={Theme.colors.accent} />
                      <Text style={styles.rewardSectionTitle}>Rutinas de Maestría ({rewardRoutines.length})</Text>
                      <Ionicons name={showRewards ? "chevron-up" : "chevron-down"} size={16} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => setIsRewardsHidden(true)}>
                      <Ionicons name="eye-off-outline" size={18} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  {showRewards && (
                    <View style={styles.rewardList}>
                      {rewardRoutines.map((item: any) => renderRoutineItem({ item }))}
                    </View>
                  )}
                </View>
              )}

              {isRewardsHidden && rewardRoutines.length > 0 && (
                <TouchableOpacity 
                  style={{ alignSelf: 'center', marginBottom: 20 }} 
                  onPress={() => setIsRewardsHidden(false)}
                >
                  <Text style={{ color: Theme.colors.textSecondary, fontSize: 10, textDecorationLine: 'underline' }}>
                    Mostrar Rutinas de Maestría
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.subtitle}>Tus Rutinas</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleCreateNew}>
                  <Ionicons name="add" size={24} color={Theme.colors.text} />
                </TouchableOpacity>
              </View>
              
              {userTemplates.map(item => renderRoutineItem({ item }))}
              {userTemplates.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <Ionicons name="skull-outline" size={60} color={Theme.colors.cardLight} />
                  <Text style={styles.emptyText}>Sin rutinas. Empieza tu leyenda.</Text>
                  <TouchableOpacity style={styles.createBtn} onPress={handleCreateNew}>
                    <Text style={styles.createBtnText}>CREAR RUTINA</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ height: 40 }} />
            </>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  content: { flex: 1, paddingHorizontal: Theme.spacing.md },
  header: { 
    marginTop: Theme.spacing.sm, 
    marginBottom: Theme.spacing.xl, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  welcomeText: { ...Theme.typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  title: { ...Theme.typography.h1, fontSize: 28 },
  profileIcon: { ...Theme.shadows.medium },
  
  // Skill Widget Styles
  skillWidget: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.strong,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  widgetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trophyBg: { 
    backgroundColor: 'rgba(255, 215, 0, 0.1)', 
    padding: 8, 
    borderRadius: Theme.roundness.md 
  },
  widgetTitle: { ...Theme.typography.h3, fontSize: 16 },
  countText: { ...Theme.typography.caption, fontWeight: 'bold' },
  mainProgressContainer: { marginBottom: Theme.spacing.md },
  progressTrack: { height: 6, backgroundColor: Theme.colors.cardLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Theme.colors.success },
  
  nextSkillCard: {
    backgroundColor: Theme.colors.cardLight,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.sm + 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextInfo: { flex: 1 },
  nextLabel: { ...Theme.typography.caption, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  nextNodeTitle: { ...Theme.typography.body, fontSize: 14, fontWeight: '800', marginTop: 2 },
  reqSummary: { gap: 4, alignItems: 'flex-end' },
  reqMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reqMiniText: { ...Theme.typography.caption, fontSize: 10, fontWeight: '600' },
  reqMetText: { color: Theme.colors.success },
  allDoneText: { color: Theme.colors.accent, textAlign: 'center', fontWeight: 'bold', fontSize: 14 },

  rewardSection: { marginBottom: Theme.spacing.xl },
  rewardAccordionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: Theme.colors.card, 
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: Theme.colors.accent + '33'
  },
  rewardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rewardSectionTitle: { ...Theme.typography.h3, fontSize: 14, color: Theme.colors.accent },
  rewardList: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: Theme.colors.accent + '22' },

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Theme.spacing.md 
  },
  subtitle: { ...Theme.typography.h2, fontSize: 20 },
  addBtn: { 
    backgroundColor: Theme.colors.primary, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Theme.shadows.medium,
  },
  
  routineCard: { 
    backgroundColor: Theme.colors.card, 
    padding: Theme.spacing.md, 
    borderRadius: Theme.roundness.lg, 
    marginBottom: Theme.spacing.md, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    ...Theme.shadows.light,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  routineIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  routineInfo: { flex: 1 },
  routineName: { ...Theme.typography.h3, fontSize: 17, marginBottom: 2 },
  routineMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routineDate: { ...Theme.typography.caption, fontWeight: '600' },
  cardActionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editBtn: { padding: 5 },
  playBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: Theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 15 },
  emptyText: { ...Theme.typography.body, color: Theme.colors.textSecondary, fontWeight: '600' },
  createBtn: { 
    backgroundColor: Theme.colors.primary, 
    paddingHorizontal: 25, 
    paddingVertical: 12, 
    borderRadius: Theme.roundness.full,
    marginTop: 10
  },
  createBtnText: { ...Theme.typography.button, color: '#fff' }
});