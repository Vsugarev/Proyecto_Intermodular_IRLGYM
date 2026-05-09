import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutService } from '../../../application/service/WorkoutService';
import { auth } from '../../../infrastructure/config/firebase';

export const HomeScreen = ({ navigation }: any) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (user) {
        loadWorkouts(user.uid);
      } else {
        setLoading(false);
      }
    }, [])
  );

  const loadWorkouts = async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      const data = await WorkoutService.getWorkoutsByUser(uid);
      setTemplates(data.filter(w => w.isTemplate));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Debes estar identificado");
      return;
    }

    try {
      const defaultName = "Nueva Rutina";
      const newRoutine = await WorkoutService.createEmptyTemplate(user.uid, defaultName);
      navigation.navigate('EditRoutine', { routine: newRoutine });
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo crear la rutina");
    }
  };

  const handleStartRoutine = async (routineId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const session = await WorkoutService.duplicateRoutine(routineId, user.uid);
      navigation.navigate('EditRoutine', { routine: session });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo iniciar el entrenamiento");
    }
  };

  const renderRoutineItem = ({ item }: any) => (
    <View style={styles.routineCard}>
      <TouchableOpacity 
        style={styles.routineInfo} 
        onPress={() => handleStartRoutine(item.id)}
      >
        <Text style={styles.routineName}>{item.name || "Sin nombre"}</Text>
        <Text style={styles.routineDate}>Creada el {new Date(item.date).toLocaleDateString()}</Text>
      </TouchableOpacity>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.editIconBtn} 
          onPress={() => navigation.navigate('EditRoutine', { routine: item })}
        >
          <Ionicons name="create-outline" size={20} color="#8e8e93" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.startBtn} 
          onPress={() => handleStartRoutine(item.id)}
        >
          <Ionicons name="play" size={18} color="#fff" />
          <Text style={styles.startBtnText}>ENTRENAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Guerrero</Text>
        <Text style={styles.userText}>{auth.currentUser?.email}</Text>
      </View>
      
      <FlatList
        data={[]} 
        renderItem={null}
        ListHeaderComponent={
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.subtitle}>Tus Rutinas</Text>
              <TouchableOpacity onPress={handleCreateNew}>
                <Text style={styles.addText}>+ NUEVA</Text>
              </TouchableOpacity>
            </View>
            
            {templates.map(item => (
              <View key={item.id}>
                {renderRoutineItem({ item })}
              </View>
            ))}
            {templates.length === 0 && <Text key="empty-templates" style={styles.emptyText}>No tienes plantillas.</Text>}
            <View style={{ height: 100 }} />
          </>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f7' },
  header: { marginTop: 40, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#1c1c1e', letterSpacing: -1 },
  userText: { fontSize: 14, color: '#8e8e93', fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  subtitle: { fontSize: 20, fontWeight: '800', color: '#1c1c1e' },
  addText: { color: '#28a745', fontWeight: 'bold', fontSize: 14 },
  listContainer: { paddingBottom: 20 },
  routineCard: { 
    backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  routineInfo: { flex: 1, paddingVertical: 4 },
  routineName: { fontSize: 18, fontWeight: '800', color: '#1c1c1e' },
  routineDate: { fontSize: 11, color: '#8e8e93', marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  editIconBtn: { padding: 10, marginRight: 5 },
  startBtn: { 
    backgroundColor: '#28a745', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 10,
  },
  startBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  emptyText: { textAlign: 'center', color: '#8e8e93', marginTop: 10, fontSize: 14, fontStyle: 'italic' }
});