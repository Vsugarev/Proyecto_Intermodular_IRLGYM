import { StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from './theme';

export const globalStyles = StyleSheet.create({
  // Contenedores Principales
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.m,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.white,
  },
  headerContainer: { 
    alignItems: 'center', 
    padding: Spacing.xl, 
    backgroundColor: Colors.background,
    borderBottomLeftRadius: BorderRadius.large,
    borderBottomRightRadius: BorderRadius.large 
  },

  // Tarjetas y UI
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },

  // Tipografía
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.m,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  caption: {
    fontSize: 12,
    color: Colors.textLight,
  },

  // Inputs y Formularios
  input: {
    width: '100%',
    backgroundColor: Colors.lightGray,
    padding: Spacing.m,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.m,
    fontSize: 16,
    color: Colors.text,
  },

  // Botones
  buttonPrimary: {
    backgroundColor: Colors.primary,
    padding: Spacing.m,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    width: '100%',
  },
  buttonSuccess: {
    backgroundColor: Colors.success,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Barras de Progreso
  progressBg: { 
    height: 14, 
    backgroundColor: Colors.lightGray, 
    borderRadius: 7, 
    overflow: 'hidden',
    width: '100%'
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: Colors.success 
  },

  // Utilidades
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});