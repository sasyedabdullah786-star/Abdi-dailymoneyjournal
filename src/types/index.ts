export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin: string;
}

export interface AdminRecord {
  id?: string;
  uid?: string;
  email: string;
  role?: 'admin' | 'user';
  createdAt?: string;
  assignedAt?: string;
}

export interface MoneyEntry {
  id: string;
  userId?: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm AM/PM
  createdAt: string;
}

export type Transaction = MoneyEntry;

export interface PendingItem {
  id: string;
  userId?: string;
  type: 'receive' | 'pay';
  amount: number;
  description: string;
  createdAt: string;
}

export type PendingMoney = PendingItem;

export interface MustangGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  notes?: string;
}

export interface DownloadLog {
  id: string;
  version: string;
  platform: string;
  userAgent?: string;
  downloadedAt?: string;
  timestamp?: string;
}

export interface AppSettings {
  appName: string;
  packageName?: string;
  appTagline?: string;
  description?: string;
  currentVersion: string;
  versionCode?: number;
  minAndroidVersion?: string;
  apkUrl: string;
  apkSize: string;
  releaseDate: string;
  apkAvailable: boolean;
  totalDownloads: number;
  updatedAt: string;
}

export interface WebsiteSettings {
  heroTitle?: string;
  heroSubtitle?: string;
  announcementBadge?: string;
  announcementText: string;
  announcementActive: boolean;
  supportEmail: string;
  githubUrl?: string;
  updatedAt: string;
}

export interface Release {
  id: string;
  version?: string;
  versionName?: string;
  versionCode: number;
  releaseDate: string;
  fileSize?: string;
  apkSize?: string;
  minAndroid?: string;
  apkUrl: string;
  sha256?: string;
  whatsNew?: string[];
  changelog?: string[];
  isCurrent: boolean;
  downloadCount: number;
  createdAt?: string;
}
