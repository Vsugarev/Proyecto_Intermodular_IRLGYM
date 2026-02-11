import { useState, useCallback } from 'react';
import { getRoutines } from '../services/database';
import { auth } from '../services/firebaseConfig';

export const useRoutines = () => {
  const [routines, setRoutines] = useState([]);

  const loadRoutines = useCallback(() => {
    // Verificamos que haya un usuario antes de pedir datos
    if (auth.currentUser) {
      try {
        const data = getRoutines(auth.currentUser.uid);
        setRoutines(data || []);
      } catch (e) {
        console.error("Error cargando rutinas:", e);
        setRoutines([]);
      }
    }
  }, []);

  return { routines, loadRoutines };
};