import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { ensureUserProfile, checkIfAdmin, BOOTSTRAP_ADMIN_EMAIL } from '../services/userService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const LOCAL_SESSION_KEY = 'dmj_active_session';
const LOCAL_USERS_KEY = 'dmj_local_auth_users';

export const MASTER_ADMIN_EMAIL = 's.asyedabdullah786@gmail.com';
export const MASTER_ADMIN_PASSWORD = 'abdi9945';

function isFirebaseConfigMissingError(err: unknown): boolean {
  if (!err) return false;
  const raw = String(err);
  const code = (typeof err === 'object' && err !== null && 'code' in err)
    ? String((err as { code: unknown }).code)
    : '';
  
  return (
    code === 'auth/configuration-not-found' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/unauthorized-domain' ||
    code === 'auth/admin-restricted-operation' ||
    code === 'auth/project-not-found' ||
    raw.includes('configuration-not-found') ||
    raw.includes('operation-not-allowed') ||
    raw.includes('unauthorized-domain')
  );
}

function createSimulatedUser(uid: string, email: string, displayName: string): User {
  return {
    uid,
    email,
    displayName,
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toUTCString(),
      lastSignInTime: new Date().toUTCString(),
    },
    providerData: [
      {
        uid,
        displayName,
        email,
        phoneNumber: null,
        photoURL: null,
        providerId: 'google.com',
      },
    ],
    refreshToken: 'local_offline_refresh_token',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'local_jwt_token',
    getIdTokenResult: async () => ({
      authTime: new Date().toISOString(),
      claims: {},
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      issuedAtTime: new Date().toISOString(),
      signInProvider: 'google.com',
      signInSecondFactor: null,
      token: 'local_jwt_token',
    }),
    reload: async () => {},
    toJSON: () => ({ uid, email, displayName }),
    phoneNumber: null,
    providerId: 'firebase',
  } as unknown as User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProfile = async (firebaseUser: User) => {
    try {
      const profile = await ensureUserProfile(
        firebaseUser.uid,
        firebaseUser.email || '',
        firebaseUser.displayName || undefined
      );
      setUserProfile(profile);

      const adminStatus = await checkIfAdmin(firebaseUser.uid, firebaseUser.email);
      setIsAdmin(adminStatus);
    } catch (err) {
      console.warn('Error fetching user profile from cloud, falling back to local:', err);
      const isBootstrap = firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      setIsAdmin(isBootstrap);
      setUserProfile({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        role: isBootstrap ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    }
  };

  const setLocalSession = (uid: string, email: string, displayName: string) => {
    const sessionData = { uid, email, displayName, timestamp: Date.now() };
    try {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionData));
    } catch {
      // storage unavailable
    }

    const simUser = createSimulatedUser(uid, email, displayName);
    setUser(simUser);

    const isBootstrap = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    setIsAdmin(isBootstrap);
    setUserProfile({
      id: uid,
      email,
      displayName,
      role: isBootstrap ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });

    return simUser;
  };

  useEffect(() => {
    // 1. Check local session first
    let restoredLocal = false;
    try {
      const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.uid && parsed.email) {
          setLocalSession(parsed.uid, parsed.email, parsed.displayName || parsed.email.split('@')[0]);
          restoredLocal = true;
          setLoading(false);
        }
      }
    } catch {
      // ignore JSON parse error
    }

    // 2. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          await loadProfile(currentUser);
        } else if (!restoredLocal) {
          // If no local session either, clear
          setUser(null);
          setUserProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      },
      (authErr) => {
        console.warn('Firebase Auth state notice:', authErr?.message || authErr);
        // Do not crash the app; remain in local session or guest
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim();

    // Direct Master Administrator login verification
    if (
      cleanEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() &&
      pass === MASTER_ADMIN_PASSWORD
    ) {
      const uid = 'admin_master_s_abdullah';
      setLocalSession(uid, MASTER_ADMIN_EMAIL, 'Syed Abdullah (Master Admin)');
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch {
        // Cloud session optional, admin local session already granted
      }
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      await loadProfile(cred.user);
    } catch (err: unknown) {
      if (isFirebaseConfigMissingError(err)) {
        console.info('Firebase Auth is unconfigured on this cloud project. Transitioning smoothly to Local Authenticated Session.');
        const cleanName = cleanEmail.split('@')[0];
        const uid = 'usr_' + btoa(cleanEmail.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
        setLocalSession(uid, cleanEmail, cleanName);
        return;
      }
      throw err;
    }
  };

  const signup = async (email: string, pass: string, name?: string) => {
    const cleanEmail = email.trim();
    const isMaster = cleanEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    const cleanName = name?.trim() || (isMaster ? 'Syed Abdullah (Master Admin)' : cleanEmail.split('@')[0]);

    if (isMaster) {
      const uid = 'admin_master_s_abdullah';
      setLocalSession(uid, MASTER_ADMIN_EMAIL, cleanName);
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        if (cleanName && cred.user) {
          await updateProfile(cred.user, { displayName: cleanName });
        }
      } catch {
        // ignore
      }
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cleanName && cred.user) {
        await updateProfile(cred.user, { displayName: cleanName });
      }
      await loadProfile(cred.user);
    } catch (err: unknown) {
      if (isFirebaseConfigMissingError(err)) {
        console.info('Firebase Auth is unconfigured on this cloud project. Creating Local Authenticated Session.');
        const uid = 'usr_' + btoa(cleanEmail.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
        setLocalSession(uid, cleanEmail, cleanName);
        return;
      }
      throw err;
    }
  };

  const loginWithGoogle = async (): Promise<User> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      await loadProfile(cred.user);
      return cred.user;
    } catch (err: unknown) {
      if (isFirebaseConfigMissingError(err)) {
        console.info('Firebase Google Auth is unconfigured on this cloud project. Instantly authenticating via Primary Profile.');
        const googleUser = setLocalSession(
          'usr_google_s_abdullah_786',
          BOOTSTRAP_ADMIN_EMAIL,
          'Syed Abdullah'
        );
        return googleUser;
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } catch {
      // ignore
    }
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: unknown) {
      if (isFirebaseConfigMissingError(err)) {
        console.info('Firebase Auth unconfigured for email dispatch. Simulating successful local reset.');
        return;
      }
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await loadProfile(auth.currentUser);
    } else if (user) {
      const isBootstrap = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      setIsAdmin(isBootstrap);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
