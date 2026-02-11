import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserStats } from '../services/database';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const StatsContext = createContext();

export const StatsProvider = ({ children }) => {
  const [stats, setStats] = useState({ xp: 0, streak: 0 });

  const reloadStats = () => {
    if (auth.currentUser) {
      const data = getUserStats(auth.currentUser.uid);
      setStats(data || { xp: 0, streak: 0 });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        reloadStats();
      } else {
        setStats({ xp: 0, streak: 0 });
      }
    });
    return unsubscribe;
  }, []);

  return (
    <StatsContext.Provider value={{ stats, reloadStats }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => useContext(StatsContext);