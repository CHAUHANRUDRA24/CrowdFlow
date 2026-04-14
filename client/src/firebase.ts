import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAE-ggI1VeLATIySM7JSe3r2lcYqhafNmI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "crowdflowai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "crowdflowai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "crowdflowai.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "954114689593",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:954114689593:web:e363e715a6d42f458ddbe8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-475f06cf-c76f-4fb2-bbb2-fa74ec1e7c4c");
export const googleProvider = new GoogleAuthProvider();
