import { useState, useCallback } from 'react';
import { getRoutines } from '../services/database';
import { auth } from '../services/firebaseConfig';

export const useRoutines = () => {
  const [routines, setRoutines] = useState([]);

  const loadRoutines = useCallback(() => {
    if (auth.currentUser) {
      try {
        const data = getRoutines(auth.currentUser.uid);
        // Nos aseguramos de que siempre sea un Array para evitar errores en el FlatList
        setRoutines(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error cargando rutinas:", e);
        setRoutines([]);
      }
    }
  }, []);

  return { routines, loadRoutines };
};