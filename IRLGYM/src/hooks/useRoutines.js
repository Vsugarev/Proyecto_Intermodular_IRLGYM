import { useState, useCallback } from 'react';
import { getRoutines } from '../services/database';
import { auth } from '../services/firebaseConfig';

export const useRoutines = () => {
  const [routines, setRoutines] = useState([]);

  const loadRoutines = useCallback(() => {
    if (auth.currentUser) {
      const data = getRoutines(auth.currentUser.uid);
      setRoutines(data);
    }
  }, []);

  return { routines, loadRoutines };
};