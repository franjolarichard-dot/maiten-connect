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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
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
            // Usuario nuevo sin perfil de db (Raro, pero manejamos el edge case)
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "",
              role: "CLIENT", 
              createdAt: new Date(),
            };
            await setDoc(doc(db, "users", currentUser.uid), newProfile);
            setProfile(newProfile);
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
      
      // Si es proveedor, va a la coleccion providers. Si es client, users.
      const collectionName = role === "PROVIDER" ? "providers" : "users";
      const docRef = doc(db, collectionName, result.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        const newProfile: any = {
          uid: result.user.uid,
          email: result.user.email || "",
          displayName: result.user.displayName || "",
          role,
          createdAt: new Date(),
        };
        
        if(role === "PROVIDER") {
            newProfile.servicesOffered = [];
            newProfile.location = { lat: 0, lng: 0, address: "Pendiente", city: "Pendiente" };
            newProfile.activeRadiusKm = 30;
            newProfile.rating = 0;
            newProfile.reviewCount = 0;
            newProfile.isAvailable = true;
        }

        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
