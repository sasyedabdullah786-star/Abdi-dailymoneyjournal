import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Release } from '../types';

export const DEFAULT_RELEASES: Release[] = [
  {
    id: 'rel_2_4_0',
    version: '2.4.0',
    versionCode: 24,
    releaseDate: 'September 20, 2026',
    apkSize: '8.4 MB',
    apkUrl: '/assets/daily-money-journal-v2.4.0.apk',
    isCurrent: true,
    minAndroid: 'Android 8.0+',
    sha256: '9e8a72cf5021e8d4a65b8214152861a340b0f94ef1ad1085002ff2db50a7c93e',
    changelog: [
      '⚡ Redesigned Quick Entry keypad with instant ₹ presets (₹50, ₹100, ₹200, ₹500)',
      '⏳ New Pending Money reconciliation ledger: mark received or paid directly into daily entries',
      '📱 Progressive Web App (PWA) offline support: install directly from mobile browser',
      '📝 Enhanced Smart Notes autosave with local encryption',
      '🐎 Mustang goal-tracking vault interface updates',
      '🔒 Fully sandboxed Android APK build with zero tracking libraries',
    ],
    downloadCount: 1420,
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'rel_2_3_2',
    version: '2.3.2',
    versionCode: 23,
    releaseDate: 'August 14, 2026',
    apkSize: '8.1 MB',
    apkUrl: '/assets/daily-money-journal-v2.3.2.apk',
    isCurrent: false,
    minAndroid: 'Android 8.0+',
    sha256: '6f7b3c2d1e0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e',
    changelog: [
      'Fixed currency locale rendering for Indian Rupee format (en-IN)',
      'Optimized daily history lookup speed across multi-month archives',
      'Resolved keyboard overlap on entry description input on Samsung OneUI',
    ],
    downloadCount: 890,
    createdAt: '2026-08-14T08:30:00.000Z',
  },
  {
    id: 'rel_2_2_0',
    version: '2.2.0',
    versionCode: 22,
    releaseDate: 'June 05, 2026',
    apkSize: '7.8 MB',
    apkUrl: '/assets/daily-money-journal-v2.2.0.apk',
    isCurrent: false,
    minAndroid: 'Android 8.0+',
    sha256: '3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d',
    changelog: [
      'Introduced Smart Money Notes for planning upcoming loans and home funds',
      'Added Category filter tags (Personal, Home, Business, Food, Bills, etc.)',
      'Battery performance optimizations on background daily rollover',
    ],
    downloadCount: 650,
    createdAt: '2026-06-05T12:00:00.000Z',
  },
];

export async function getReleases(): Promise<Release[]> {
  const path = 'releases';
  try {
    const q = query(collection(db, 'releases'), orderBy('versionCode', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as Release);
    }
    return DEFAULT_RELEASES;
  } catch (error) {
    console.warn('Could not read remote releases, using fallback:', error);
    return DEFAULT_RELEASES;
  }
}

export async function getCurrentRelease(): Promise<Release> {
  const releases = await getReleases();
  const current = releases.find((r) => r.isCurrent);
  return current || releases[0] || DEFAULT_RELEASES[0];
}

export async function saveRelease(release: Release): Promise<void> {
  const path = `releases/${release.id}`;
  try {
    // If setting as current, un-mark previous current releases
    if (release.isCurrent) {
      const all = await getReleases();
      for (const r of all) {
        if (r.id !== release.id && r.isCurrent) {
          await updateDoc(doc(db, 'releases', r.id), { isCurrent: false });
        }
      }
    }
    await setDoc(doc(db, 'releases', release.id), release, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRelease(releaseId: string): Promise<void> {
  const path = `releases/${releaseId}`;
  try {
    await deleteDoc(doc(db, 'releases', releaseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function incrementReleaseDownload(releaseId: string): Promise<void> {
  const path = `releases/${releaseId}`;
  try {
    await updateDoc(doc(db, 'releases', releaseId), {
      downloadCount: increment(1),
    });
  } catch {
    // Non-critical background count update
  }
}
