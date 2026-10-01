
'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import LoadingSpinner from '@/components/agrisahayak/loading-spinner';

// ─── ADMIN phone numbers (E.164 format) ──────────────────────────────────────
export const ADMIN_PHONES = ['+923001234567', '+923244149474'];

// 1. Define the context shape
interface FirebaseContextType {
  auth: Auth;
  db: Firestore;
  app: FirebaseApp;
}

interface AuthContextType {
  user: User | null;
  isUserLoading: boolean;
  auth: Auth;
  /** true if current user has admin access */
  isAdmin: boolean;
  /** phone number of the current user (Firebase or demo session) */
  userPhone: string | null;
}

// 2. Create the contexts
const FirebaseContext = createContext<FirebaseContextType | null>(null);
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Create the Provider components
function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const auth = getAuth(app);
    let db: Firestore;
    try {
        db = getFirestore(app);
    } catch (e) {
        db = getFirestore(app);
    }

    setFirebase({ auth, db, app });
  }, []);

  if (!firebase) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner message="Connecting to services..." />
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebase = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  useEffect(() => {
    if (firebase) {
      const unsubscribe = onAuthStateChanged(firebase.auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setUserPhone(firebaseUser.phoneNumber);
          setIsUserLoading(false);
        } else {
          // Check for demo session (bypass mode for billing-not-enabled)
          try {
            const demoSession = localStorage.getItem('agriguard_demo_session');
            if (demoSession) {
              const session = JSON.parse(demoSession);
              // Create a minimal user-like object for demo sessions
              const demoUser = {
                uid: session.uid,
                phoneNumber: session.phone,
                displayName: null,
                email: null,
                photoURL: null,
                isAnonymous: false,
                emailVerified: false,
                providerData: [],
                metadata: {},
                tenantId: null,
                refreshToken: '',
                getIdToken: async () => '',
                getIdTokenResult: async () => ({ token: '', claims: {}, issuedAtTime: '', expirationTime: '', authTime: '', signInProvider: null, signInSecondFactor: null }),
                reload: async () => {},
                toJSON: () => ({}),
                delete: async () => {},
              } as unknown as User;
              setUser(demoUser);
              setUserPhone(session.phone);
            } else {
              setUser(null);
              setUserPhone(null);
            }
          } catch {
            setUser(null);
            setUserPhone(null);
          }
          setIsUserLoading(false);
        }
      });
      return () => unsubscribe();
    }
  }, [firebase]);

  // Determine if the current user is an admin
  const isAdmin = ADMIN_PHONES.includes(userPhone || '');

  return (
    <AuthContext.Provider value={{ user, isUserLoading, auth: firebase.auth, isAdmin, userPhone }}>
      {children}
    </AuthContext.Provider>
  );
}

// Top-level provider that combines both
export function AppFirebaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseProvider>
  );
}

// 4. Create the custom hooks
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
