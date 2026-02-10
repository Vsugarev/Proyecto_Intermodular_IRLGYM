import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDFAXyZOzYZkeYL_HiBL5-CMOKS0Nz7JpE",
  authDomain: "irlgym-c83a3.firebaseapp.com",
  projectId: "irlgym-c83a3",
  storageBucket: "irlgym-c83a3.firebasestorage.app",
  messagingSenderId: "834575797782",
  appId: "1:834575797782:web:07a381c236e00fdd452f37"
};

const app = initializeApp(firebaseConfig);

// Esto es vital: decide cómo guardar la sesión si es web o móvil
const persistence = Platform.OS === 'web' 
  ? browserLocalPersistence 
  : getReactNativePersistence(AsyncStorage);

export const auth = initializeAuth(app, { persistence });
export const db = getFirestore(app);