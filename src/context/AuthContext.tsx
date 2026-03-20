"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, UserRole } from "@/lib/types";

// Agrupar ambos perfiles posibles
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (role: UserRole) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: UserRole, phone: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Verificar si es proveedor o cliente (guardados en 'users' o 'providers' en DB final, pero para centralizar Auth usaremos 'users' como maestra)
        let docRef = doc(db, "users", currentUser.uid);
        let docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Intentar en providers por si acaso
          docRef = doc(db, "providers", currentUser.uid);
          docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             setProfile(docSnap.data() as UserProfile);
          } else {
             setProfile(null);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (role: UserRole) => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await ensureProfileExists(result.user.uid, result.user.email || "", result.user.displayName || "", role, "");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with Email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role: UserRole, phone: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
      await ensureProfileExists(result.user.uid, email, name, role, phone);
    } catch (error) {
      console.error("Error signing up with Email:", error);
      throw error;
    }
  };

  const ensureProfileExists = async (uid: string, email: string, name: string, role: UserRole, phone: string) => {
    const collectionName = role === "PROVIDER" ? "providers" : "users";
    const docRef = doc(db, collectionName, uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      const newProfile: any = {
        uid,
        email,
        displayName: name,
        role,
        phone,
        createdAt: new Date(),
      };
      
      if(role === "PROVIDER") {
          newProfile.servicesOffered = [];
          newProfile.location = { lat: -32.65, lng: -71.43, address: "Maitencillo", city: "Maitencillo" };
          newProfile.activeRadiusKm = 30;
          newProfile.rating = 0;
          newProfile.reviewCount = 0;
          newProfile.isAvailable = true;
      }

      await setDoc(docRef, newProfile);
      setProfile(newProfile);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
