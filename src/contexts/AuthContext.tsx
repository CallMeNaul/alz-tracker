
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  User,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

interface UserData {
  displayName: string;
  role: "patient" | "doctor" | "admin";
  patientId?: string;
  doctorId?: string;
  gender?: "male" | "female" | "other";
  age?: number;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role: "patient" | "doctor" | "admin", doctorId?: string | null, gender?: "male" | "female" | "other", age?: number) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isDoctor: () => boolean;
  isPatient: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext) as AuthContextType;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  async function register(
    email: string, 
    password: string, 
    displayName: string, 
    role: "patient" | "doctor" | "admin", 
    doctorId?: string | null,
    gender?: "male" | "female" | "other",
    age?: number
  ) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      
      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];
      
      const userData: UserData = {
        displayName,
        role,
        email,
        createdAt: currentDate,
        ...(role === "patient" && doctorId ? { doctorId } : {}),
        ...(gender ? { gender } : {}),
        ...(age && role === "patient" ? { age } : {})
      };
      
      await setDoc(doc(db, "users", userCredential.user.uid), userData);
    }
  }

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password).then(() => {});
  }

  function logout() {
    return signOut(auth).then(() => {});
  }

  function isAdmin() {
    return userData?.role === "admin";
  }

  function isDoctor() {
    return userData?.role === "doctor";
  }

  function isPatient() {
    return userData?.role === "patient";
  }

  useEffect(() => {
    const fetchUserData = async (user: User) => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isDoctor,
    isPatient
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
