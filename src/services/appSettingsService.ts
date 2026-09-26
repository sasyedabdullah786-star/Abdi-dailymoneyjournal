import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AppSettings, WebsiteSettings } from '../types';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  appName: 'Daily Money Journal',
  packageName: 'com.abdi.dailymoneyjournal',
  currentVersion: '2.4.0',
  apkUrl: '/com.abdi.dailymoneyjournal.apk',
  apkSize: '0.55 MB',
  releaseDate: 'September 25, 2026',
  apkAvailable: true,
  totalDownloads: 1420,
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  announcementText: 'Daily Money Journal — Clean daily cashflow ledger.',
  announcementActive: false,
  supportEmail: 's.asyedabdullah786@gmail.com',
  updatedAt: new Date().toISOString(),
};

export async function getAppSettings(): Promise<AppSettings> {
  const path = 'appSettings/main';
  try {
    const snap = await getDoc(doc(db, 'appSettings', 'main'));
    if (snap.exists()) {
      return { ...DEFAULT_APP_SETTINGS, ...(snap.data() as AppSettings) };
    }
    return DEFAULT_APP_SETTINGS;
  } catch (error) {
    console.warn('Could not read remote appSettings, using local fallback:', error);
    return DEFAULT_APP_SETTINGS;
  }
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
  const path = 'appSettings/main';
  try {
    await setDoc(
      doc(db, 'appSettings', 'main'),
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  const path = 'websiteSettings/main';
  try {
    const snap = await getDoc(doc(db, 'websiteSettings', 'main'));
    if (snap.exists()) {
      return { ...DEFAULT_WEBSITE_SETTINGS, ...(snap.data() as WebsiteSettings) };
    }
    return DEFAULT_WEBSITE_SETTINGS;
  } catch (error) {
    console.warn('Could not read remote websiteSettings, using local fallback:', error);
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

export async function updateWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<void> {
  const path = 'websiteSettings/main';
  try {
    await setDoc(
      doc(db, 'websiteSettings', 'main'),
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
