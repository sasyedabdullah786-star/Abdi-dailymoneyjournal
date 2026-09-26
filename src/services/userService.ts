import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, AdminRecord } from '../types';

export const BOOTSTRAP_ADMIN_EMAIL = 's.asyedabdullah786@gmail.com';

export async function ensureUserProfile(uid: string, email: string, displayName?: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const isAdminEmail = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      // Auto-escalate if matching bootstrap admin
      if (isAdminEmail && data.role !== 'admin') {
        await updateDoc(userRef, { role: 'admin' });
        await setDoc(doc(db, 'admins', uid), {
          uid,
          email,
          assignedAt: new Date().toISOString(),
        } as unknown as AdminRecord);
        return { ...data, role: 'admin' };
      }
      return data;
    }

    const newUser: UserProfile = {
      id: uid,
      email,
      displayName: displayName || email.split('@')[0],
      role: isAdminEmail ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    await setDoc(userRef, newUser);

    if (isAdminEmail) {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email,
        assignedAt: new Date().toISOString(),
      } as unknown as AdminRecord);
    }

    return newUser;
  } catch (error) {
    console.warn('Error in ensureUserProfile:', error);
    return {
      id: uid,
      email,
      displayName: displayName || email.split('@')[0],
      role: isAdminEmail ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  }
}

export async function checkIfAdmin(uid: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    if (adminSnap.exists()) return true;

    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists() && userSnap.data()?.role === 'admin') return true;
  } catch {
    // Return false on check failure
  }
  return false;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as UserProfile);
    }
  } catch (err) {
    console.warn('Could not read users list from Firestore:', err);
  }

  // Fallback demo user records for visual dashboard
  return [
    {
      id: 'usr_admin',
      email: BOOTSTRAP_ADMIN_EMAIL,
      displayName: 'Syed Abdullah (Admin)',
      role: 'admin',
      createdAt: '2026-09-01T12:00:00.000Z',
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr_2',
      email: 'rahul.finance@example.com',
      displayName: 'Rahul Sharma',
      role: 'user',
      createdAt: '2026-09-12T14:30:00.000Z',
      lastLogin: '2026-09-23T11:20:00.000Z',
    },
    {
      id: 'usr_3',
      email: 'priya.k@example.com',
      displayName: 'Priya Kapoor',
      role: 'user',
      createdAt: '2026-09-18T09:15:00.000Z',
      lastLogin: '2026-09-24T05:40:00.000Z',
    },
  ];
}

export async function toggleUserRole(uid: string, currentRole: 'admin' | 'user'): Promise<'admin' | 'user'> {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  try {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
    if (newRole === 'admin') {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email: 'assigned-admin@user.internal',
        assignedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error toggling role:', error);
  }
  return newRole;
}
