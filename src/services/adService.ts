import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdSettings } from '../types';

const DEFAULT_AD_SETTINGS: AdSettings = {
  enabled: true,
  adNetwork: 'custom',
  adsensePublisherId: '',
  adsenseSlotId: '',
  customBanner: {
    title: 'Smart Financial Management with Daily Money Journal',
    description: 'Track daily cash flow, record pending balances, and reach your savings target faster.',
    badgeText: 'SPONSORED',
    ctaText: 'Learn More',
    targetUrl: '#',
    imageUrl: '',
  },
  showOnJournal: true,
  showOnDownload: true,
};

const LOCAL_STORAGE_KEY = 'dmj_ad_settings';

export async function getAdSettings(): Promise<AdSettings> {
  try {
    const docRef = doc(db, 'settings', 'ads');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AdSettings;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return { ...DEFAULT_AD_SETTINGS, ...data };
    }
  } catch (err) {
    console.warn('Could not fetch ad settings from Firestore, using local fallback:', err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      return { ...DEFAULT_AD_SETTINGS, ...JSON.parse(cached) };
    }
  } catch {
    // ignore
  }

  return DEFAULT_AD_SETTINGS;
}

export async function saveAdSettings(settings: AdSettings): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }

  try {
    const docRef = doc(db, 'settings', 'ads');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.warn('Could not persist ad settings to Firestore:', err);
  }
}
