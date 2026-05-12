import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, ActivityIndicator, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { SkillService } from '../../../application/service/SkillService';
import { auth } from '../../../infrastructure/config/firebase';
import { Workout } from '../../../domain/entities/Workout';

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
        onPress={() => navigation.navigate('Skills')}
        activeOpacity={0.9}
      >
        <View style={styles.widgetHeader}>
          <View style={styles.widgetTitleRow}>
            <View style={styles.trophyBg}>
              <Ionicons name="trophy" size={18} color="#ffd700" />
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
              <Text style={styles.nextLabel}>SIGUIENTE OBJETIVO:</Text>
              <Text style={styles.nextNodeTitle}>{nextNode.title}</Text>
            </View>
            <View style={styles.reqSummary}>
              {nextNode.requirementDetails?.slice(0, 2).map((req: any, idx: number) => (
                <View key={idx} style={styles.reqMiniRow}>
                  <Ionicons 
                    name={req.met ? "checkmark-circle" : "ellipse-outline"} 
                    size={12} 
                    color={req.met ? "#28a745" : "#8e8e93"} 
                  />
                  <Text style={[styles.reqMiniText, req.met && styles.reqMetText]}>
                    {req.label} ({req.current}/{req.required}{req.unit})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.allDoneText}>¡Has dominado todas las sendas!</Text>
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
      <View style={styles.routineInfo}>
        <Text style={styles.routineName}>{item.name}</Text>
        <View style={styles.routineMeta}>
          <Ionicons name="calendar-outline" size={12} color="#8e8e93" />
          <Text style={styles.routineDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.startIconBtn} 
        onPress={() => handleStartRoutine(item.id)}
      >
        <Ionicons name="play" size={24} color="#28a745" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>¡Hola!</Text>
          <Text style={styles.title}>Panel de Guerrero</Text>
        </View>
        <TouchableOpacity style={styles.profileIcon}>
          <Ionicons name="person-circle" size={40} color="#1c1c1e" />
        </TouchableOpacity>
      </View>
      
      {loading && <ActivityIndicator style={{ marginBottom: 20 }} color="#28a745" />}

      <FlatList
        data={[]} 
        renderItem={null}
        ListHeaderComponent={
          <>
            {renderSkillWidget()}

            <View style={styles.sectionHeader}>
              <Text style={styles.subtitle}>Tus Rutinas</Text>
              <TouchableOpacity style={styles.addBtn} onPress={handleCreateNew}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {templates.map(item => renderRoutineItem({ item }))}
            {templates.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={48} color="#c7c7cc" />
                <Text style={styles.emptyText}>No tienes rutinas todavía.</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f7' },
  header: { 
    marginTop: 40, 
    marginBottom: 25, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  welcomeText: { fontSize: 16, color: '#8e8e93', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', color: '#1c1c1e', letterSpacing: -0.5 },
  profileIcon: { opacity: 0.8 },
  
  // Skill Widget Styles
  skillWidget: {
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  widgetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trophyBg: { 
    backgroundColor: 'rgba(255, 215, 0, 0.15)', 
    padding: 6, 
    borderRadius: 8 
  },
  widgetTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  countText: { color: '#8e8e93', fontSize: 12, fontWeight: '700' },
  mainProgressContainer: { marginBottom: 15 },
  progressTrack: { height: 6, backgroundColor: '#3a3a3c', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#28a745' },
  
  nextSkillCard: {
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextInfo: { flex: 1 },
  nextLabel: { color: '#8e8e93', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  nextNodeTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 2 },
  reqSummary: { gap: 4, alignItems: 'flex-end' },
  reqMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reqMiniText: { color: '#8e8e93', fontSize: 10, fontWeight: '600' },
  reqMetText: { color: '#28a745' },
  allDoneText: { color: '#ffd700', textAlign: 'center', fontWeight: 'bold' },

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  subtitle: { fontSize: 22, fontWeight: '900', color: '#1c1c1e' },
  addBtn: { 
    backgroundColor: '#1c1c1e', 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  routineCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3
  },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 18, fontWeight: '800', color: '#1c1c1e', marginBottom: 6 },
  routineMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  routineDate: { fontSize: 12, color: '#8e8e93', fontWeight: '600' },
  startIconBtn: { padding: 5 },
  emptyState: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyText: { color: '#c7c7cc', fontSize: 16, fontWeight: '600' }
});