import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ExerciseService } from '../../../application/service/ExerciseService';

export const ExerciseLibraryScreen = ({ route, navigation }: any) => {
  const { isSelecting, onSelect } = route.params || {};
  const [exercises, setExercises] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Categorías basadas en tus requisitos
  const categories = ['Todos', 'Favoritos', 'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo'];

  useEffect(() => {
    loadExercises();
  }, [search, category]);

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
    <View style={styles.cardContainer}>
      <TouchableOpacity style={styles.infoContainer} onPress={() => handleSelect(item)}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseSub}>{item.category} • {item.branch}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleToggleFavorite(item)} style={styles.favButton}>
        <Text style={[styles.favIcon, item.isFavorite && styles.favActive]}>
          {item.isFavorite ? '⭐' : '☆'}
        </Text>
      </TouchableOpacity>
    </View>
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
  cardContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  infoContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    backgroundColor: '#e9ecef', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  iconText: { fontWeight: 'bold', color: '#495057' },
  textContainer: { marginLeft: 15 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#333' },
  exerciseSub: { fontSize: 12, color: '#888', marginTop: 2 },
  favButton: { padding: 10 },
  favIcon: { fontSize: 22, color: '#ccc' },
  favActive: { color: '#ffc107' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});