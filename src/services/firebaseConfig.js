import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; // Cambio aquí
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importante

const firebaseConfig = {
  apiKey: "AIzaSyDFAXyZOzYZkeYL_HiBL5-CMOKS0Nz7JpE",
  authDomain: "irlgym-c83a3.firebaseapp.com",
  projectId: "irlgym-c83a3",
  storageBucket: "irlgym-c83a3.firebasestorage.app",
  messagingSenderId: "834575797782",
  appId: "1:834575797782:web:07a381c236e00fdd452f37"
};

const app = initializeApp(firebaseConfig);

// Configuración para que el Login no se borre al cerrar la app
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);