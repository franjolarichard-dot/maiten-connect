import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCFIdQUcTaXeMT7S0WAdXChWURSyJTsQWs",
  authDomain: "maiten-connect.firebaseapp.com",
  projectId: "maiten-connect",
  storageBucket: "maiten-connect.firebasestorage.app",
  messagingSenderId: "144595571375",
  appId: "1:144595571375:web:65055e7bd5ef9e2d4b3a5a"
};

// Initialize Firebase securely for SSR/CSR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
