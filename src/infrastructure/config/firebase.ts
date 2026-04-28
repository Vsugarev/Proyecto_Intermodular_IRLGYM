import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth"; 
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCb8f6eL3vISgLQdj_YY8mZCIcmSeArUFw",
  authDomain: "irlgym-d862e.firebaseapp.com",
  projectId: "irlgym-d862e",
  storageBucket: "irlgym-d862e.firebasestorage.app",
  messagingSenderId: "108584601327",
  appId: "1:108584601327:web:1352bd18482f2fe0827d1a",
  measurementId: "G-ZFZJY1P83W"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = initializeAuth(app, {
  persistence: (getReactNativePersistence as any)(AsyncStorage)
});