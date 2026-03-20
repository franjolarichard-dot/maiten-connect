import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// NOTA: Reemplazar con las credenciales de un nuevo proyecto en Firebase para MaitenConnect,
// o mantener usar este si se desea compartir la base de datos de GasERP (No recomendado para producción).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD0256xAVt7P-tgCgi9bA6Jg89t-bc9d8E",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gasnor-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gasnor-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gasnor-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "97784517263",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:97784517263:web:433dc29094aee3eefe56fa"
};

// Initialize Firebase securely for SSR/CSR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
