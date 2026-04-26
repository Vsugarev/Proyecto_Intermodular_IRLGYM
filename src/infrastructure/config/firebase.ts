import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyAi9zlfVpoaRsjOqVnYYhKv6EiPZp8H7VM",
  authDomain: "irlgym-2beda.firebaseapp.com",
  projectId: "irlgym-2beda",
  storageBucket: "irlgym-2beda.firebasestorage.app",
  messagingSenderId: "87122817884",
  appId: "1:87122817884:web:712d73535704ab732b4799",
  measurementId: "G-CY461QC3YQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);