import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ExerciseService } from '../../../application/service/ExerciseService';

export const ExerciseLibraryScreen = ({ route, navigation }: any) => {
  const { isSelecting, onSelect } = route.params || {};
  const [exercises, setExercises] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Categorías basadas en tus requisitos
  const categories = ['Todos', 'Favoritos', 'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo'];

  useFocusEffect(
    React.useCallback(() => {
      loadExercises();
    }, [search, category])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 15 }} 
          onPress={() => navigation.navigate('ExerciseCreate')}
        >
          <Ionicons name="add-circle" size={28} color="#28a745" />
        </TouchableOpacity>
      ),
    });
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    // Usamos el método de búsqueda que ya filtra internamente
    const data = await ExerciseService.searchExercises(search, category);
    setExercises(data);
    setLoading(false);
  };

  const handleToggleFavorite = async (exercise: any) => {
    await ExerciseService.toggleFavorite(exercise.id, exercise.isFavorite);
    loadExercises(); // Recargamos para ver el cambio
  };

  const handleSelect = (item: any) => {
    if (isSelecting && onSelect) {
      onSelect(item); 
      navigation.goBack();
    } else {
      // Si no estamos seleccionando, vamos al detalle (Requisito 03-1)
      navigation.navigate('ExerciseDetail', { exerciseId: item.id });
    }
  };

  const renderExerciseItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleSelect(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="fitness" size={24} color="#28a745" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: '#f2f2f7' }]}>
              <Text style={styles.badgeText}>{item.category}</Text>
            </View>
            {item.isCustom && (
              <View style={[styles.badge, { backgroundColor: '#e1f5fe' }]}>
                <Text style={[styles.badgeText, { color: '#039be5' }]}>Personalizado</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity 
        onPress={(e) => { e.stopPropagation(); navigation.navigate('ExerciseDetail', { exerciseId: item.id }); }}
        style={styles.infoBtn}
      >
        <Ionicons name="information-circle-outline" size={24} color="#8e8e93" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Buscador (Requisito 01-3) */}
      <TextInput 
        style={styles.searchBar} 
        placeholder="Buscar ejercicio..." 
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      {/* Filtros (Requisito 02-1) */}
      <View style={styles.filterWrapper}>
        <FlatList 
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.chip, category === item && styles.activeChip]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.chipText, category === item && styles.activeChipText]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#28a745" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron ejercicios</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: 10 },
  searchBar: { 
    backgroundColor: '#f2f2f2', 
    padding: 12, 
    borderRadius: 10, 
    fontSize: 16,
    marginBottom: 15 
  },
  filterWrapper: { marginBottom: 15 },
  chip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#eee', 
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  activeChip: { backgroundColor: '#28a745', borderColor: '#28a745' },
  chipText: { color: '#666', fontWeight: '500' },
  activeChipText: { color: '#fff' },
  card: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { 
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f2f2f7', 
    justifyContent: 'center', alignItems: 'center', marginRight: 12 
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1c1c1e', marginBottom: 4 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase' },
  infoBtn: { padding: 8 },
  emptyText: { textAlign: 'center', color: '#8e8e93', marginTop: 40, fontSize: 14 }
});