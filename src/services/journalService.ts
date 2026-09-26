import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MoneyEntry, PendingItem, MustangGoal } from '../types';

export function getTodayDateKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatINR(val: number): string {
  return '₹' + Math.round(Number(val || 0)).toLocaleString('en-IN');
}

export function formatHumanDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ---------------- DEVICE / USER ID RESOLUTION ----------------
export function getOrCreateDeviceUserId(): string {
  const key = 'dmj_device_user_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem(key, id);
  }
  return id;
}

export function getEffectiveUserId(authUid?: string | null): string {
  if (authUid && authUid.trim().length > 0) {
    return authUid;
  }
  return getOrCreateDeviceUserId();
}

// ---------------- USER MONEY ENTRIES (FIREBASE FIRESTORE) ----------------

export function subscribeToUserEntries(
  userId: string,
  onData: (entries: MoneyEntry[]) => void,
  onError?: (err: unknown) => void
) {
  const effectiveId = getEffectiveUserId(userId);
  const q = query(
    collection(db, 'users', effectiveId, 'entries'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: MoneyEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MoneyEntry;
        // Exclude any legacy seed dummy entries
        if (!data.id?.startsWith('entry_seed_')) {
          items.push(data);
        }
      });

      onData(items);
    },
    (error) => {
      console.warn('Entries subscription error:', error);
      if (onError) onError(error);
    }
  );
}

export async function addMoneyEntryToFirestore(
  userId: string,
  entry: Omit<MoneyEntry, 'id' | 'createdAt'>
): Promise<MoneyEntry> {
  const effectiveId = getEffectiveUserId(userId);
  const id = 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const fullEntry: MoneyEntry = {
    ...entry,
    id,
    userId: effectiveId,
    createdAt: new Date().toISOString(),
  };

  const path = `users/${effectiveId}/entries/${id}`;
  try {
    await setDoc(doc(db, 'users', effectiveId, 'entries', id), fullEntry);
    return fullEntry;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteMoneyEntryFromFirestore(
  userId: string,
  entryId: string
): Promise<void> {
  const effectiveId = getEffectiveUserId(userId);
  const path = `users/${effectiveId}/entries/${entryId}`;
  try {
    await deleteDoc(doc(db, 'users', effectiveId, 'entries', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- USER PENDING MONEY (FIREBASE FIRESTORE) ----------------

export function subscribeToUserPending(
  userId: string,
  onData: (items: PendingItem[]) => void,
  onError?: (err: unknown) => void
) {
  const effectiveId = getEffectiveUserId(userId);
  const q = query(
    collection(db, 'users', effectiveId, 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: PendingItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as PendingItem;
        if (!data.id?.startsWith('pend_seed_')) {
          items.push(data);
        }
      });

      onData(items);
    },
    (error) => {
      console.warn('Pending subscription error:', error);
      if (onError) onError(error);
    }
  );
}

export async function addPendingItemToFirestore(
  userId: string,
  item: Omit<PendingItem, 'id' | 'createdAt'>
): Promise<PendingItem> {
  const effectiveId = getEffectiveUserId(userId);
  const id = 'pend_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const fullItem: PendingItem = {
    ...item,
    id,
    userId: effectiveId,
    createdAt: new Date().toISOString(),
  };

  const path = `users/${effectiveId}/pending/${id}`;
  try {
    await setDoc(doc(db, 'users', effectiveId, 'pending', id), fullItem);
    return fullItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deletePendingItemFromFirestore(
  userId: string,
  pendingId: string
): Promise<void> {
  const effectiveId = getEffectiveUserId(userId);
  const path = `users/${effectiveId}/pending/${pendingId}`;
  try {
    await deleteDoc(doc(db, 'users', effectiveId, 'pending', pendingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- USER SMART NOTES (FIREBASE FIRESTORE) ----------------

export function subscribeToUserNotes(
  userId: string,
  onData: (content: string) => void,
  onError?: (err: unknown) => void
) {
  const effectiveId = getEffectiveUserId(userId);
  const noteRef = doc(db, 'users', effectiveId, 'notes', 'main');

  return onSnapshot(
    noteRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const text = (snapshot.data()?.content as string) || '';
        // If it was the legacy seeded default note, treat as empty
        if (text.includes('Remember to collect shop rent on the 1st')) {
          onData('');
        } else {
          onData(text);
        }
      } else {
        onData('');
      }
    },
    (error) => {
      console.warn('Notes subscription error:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveUserNotesToFirestore(userId: string, content: string): Promise<void> {
  const effectiveId = getEffectiveUserId(userId);
  const path = `users/${effectiveId}/notes/main`;
  try {
    await setDoc(doc(db, 'users', effectiveId, 'notes', 'main'), {
      content,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- USER MUSTANG GOALS (FIREBASE FIRESTORE) ----------------

export function subscribeToUserMustangGoals(
  userId: string,
  onData: (goals: MustangGoal[]) => void,
  onError?: (err: unknown) => void
) {
  const effectiveId = getEffectiveUserId(userId);
  const colRef = collection(db, 'users', effectiveId, 'mustang');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: MustangGoal[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MustangGoal;
        if (data.id !== 'mustang_v8' && data.id !== 'emergency_fund') {
          items.push(data);
        }
      });

      onData(items);
    },
    (error) => {
      console.warn('Mustang subscription error:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveMustangGoalToFirestore(
  userId: string,
  goal: MustangGoal
): Promise<void> {
  const effectiveId = getEffectiveUserId(userId);
  const path = `users/${effectiveId}/mustang/${goal.id}`;
  try {
    await setDoc(doc(db, 'users', effectiveId, 'mustang', goal.id), goal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Helper backward compatibility aliases
export const syncTransactionToCloud = addMoneyEntryToFirestore;
export const deleteTransactionFromCloud = deleteMoneyEntryFromFirestore;
export const syncPendingToCloud = addPendingItemToFirestore;
export const deletePendingFromCloud = deletePendingItemFromFirestore;
export const syncNotesToCloud = saveUserNotesToFirestore;

export function getAllLocalHistoryDates(): string[] {
  return [getTodayDateKey()];
}

export function getLocalPending(): PendingItem[] {
  return [];
}

export function getLocalEntries(dateKey?: string): MoneyEntry[] {
  return [];
}

export async function getUserNotesFromFirestore(userId: string): Promise<string> {
  const effectiveId = getEffectiveUserId(userId);
  try {
    const snap = await getDoc(doc(db, 'users', effectiveId, 'notes', 'main'));
    if (snap.exists()) {
      return (snap.data()?.content as string) || '';
    }
  } catch (err) {
    console.warn('Could not read user notes:', err);
  }
  return '';
}

