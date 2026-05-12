import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ExerciseService } from '../../../application/service/ExerciseService';
import { Theme } from '../../styles/theme';

export const ExerciseLibraryScreen = ({ route, navigation }: any) => {
  const { isSelecting, onSelect } = route.params || {};
  const [exercises, setExercises] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

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
          <Ionicons name="add-circle" size={28} color={Theme.colors.success} />
        </TouchableOpacity>
      ),
    });
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    const data = await ExerciseService.searchExercises(search, category);
    setExercises(data);
    setLoading(false);
  };

  const handleToggleFavorite = async (exercise: any) => {
    await ExerciseService.toggleFavorite(exercise.id, exercise.isFavorite);
    loadExercises();
  };

  const handleSelect = (item: any) => {
    if (isSelecting && onSelect) {
      onSelect(item); 
      navigation.goBack();
    } else {
      navigation.navigate('ExerciseDetail', { exerciseId: item.id });
    }
  };

  const renderExerciseItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="fitness" size={24} color={Theme.colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.badgeRow}>
            <TouchableOpacity onPress={() => handleToggleFavorite(item)}>
              <Ionicons 
                name={item.isFavorite ? "star" : "star-outline"} 
                size={14} 
                color={item.isFavorite ? Theme.colors.accent : Theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.category}</Text>
            </View>
            {item.isCustom && (
              <View style={[styles.badge, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
                <Text style={[styles.badgeText, { color: Theme.colors.primary }]}>CUSTOM</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
        style={styles.infoBtn}
      >
        <Ionicons name="information-circle-outline" size={24} color={Theme.colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchBar} 
          placeholder="Buscar ejercicio..." 
          placeholderTextColor={Theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterWrapper}>
        <FlatList 
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Theme.spacing.md }}
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
        <ActivityIndicator size="large" color={Theme.colors.success} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={Theme.colors.cardLight} />
              <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Theme.colors.card, 
    margin: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  searchIcon: { marginRight: 10 },
  searchBar: { flex: 1, height: 48, color: Theme.colors.text, fontSize: 16 },
  filterWrapper: { marginBottom: Theme.spacing.md },
  chip: { 
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Theme.roundness.full, 
    backgroundColor: Theme.colors.card, marginRight: 8, borderWidth: 1, borderColor: Theme.colors.border
  },
  activeChip: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { color: Theme.colors.textSecondary, fontWeight: '700', fontSize: 13 },
  activeChipText: { color: '#fff' },
  listContent: { paddingHorizontal: Theme.spacing.md, paddingBottom: 40 },
  card: { 
    backgroundColor: Theme.colors.card, padding: Theme.spacing.md, borderRadius: Theme.roundness.lg, 
    marginBottom: Theme.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Theme.colors.border
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { 
    width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.colors.cardLight, 
    justifyContent: 'center', alignItems: 'center', marginRight: 12 
  },
  info: { flex: 1 },
  name: { ...Theme.typography.h3, fontSize: 16, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: Theme.colors.cardLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '900', color: Theme.colors.textSecondary },
  infoBtn: { padding: 8 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600' }
});