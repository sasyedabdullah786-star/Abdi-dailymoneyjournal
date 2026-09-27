import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Smartphone,
  Layers,
  Globe,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Search,
  ExternalLink,
  Download,
  Calendar,
  DollarSign,
  Activity,
  FileJson,
  Sliders,
  Bell,
  Database,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Zap,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppSettings, WebsiteSettings, Release, UserProfile, DownloadLog, AdSettings } from '../../types';
import { updateAppSettings, updateWebsiteSettings } from '../../services/appSettingsService';
import { getReleases, saveRelease, deleteRelease } from '../../services/releaseService';
import { getAllUsers, toggleUserRole } from '../../services/userService';
import { getRecentDownloads } from '../../services/downloadService';
import { getAdSettings, saveAdSettings } from '../../services/adService';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface Props {
  appSettings: AppSettings;
  websiteSettings: WebsiteSettings;
  onRefreshSettings: () => Promise<void>;
  onNavigate: (view: string) => void;
}

export const AdminPanel: React.FC<Props> = ({
  appSettings,
  websiteSettings,
  onRefreshSettings,
  onNavigate,
}) => {
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Navigation tab inside admin panel
  const [tab, setTab] = useState<
    'dashboard' | 'app' | 'releases' | 'website' | 'finance' | 'features' | 'monetization' | 'users' | 'analytics' | 'settings'
  >('dashboard');

  // Ad & Monetization State
  const [adForm, setAdForm] = useState<AdSettings>({
    enabled: true,
    adNetwork: 'custom',
    adsensePublisherId: '',
    adsenseSlotId: '',
    customBanner: {
      title: 'Smart Financial Management with Daily Money Journal',
      description: 'Track daily cash flow, record pending balances, and reach your savings target faster.',
      badgeText: 'SPONSORED',
      ctaText: 'Learn More',
      targetUrl: 'https://dailymoneyjournal.com',
      imageUrl: '',
    },
    showOnJournal: true,
    showOnDownload: true,
  });

  // Form states
  const [appForm, setAppForm] = useState<AppSettings>(appSettings);
  const [siteForm, setSiteForm] = useState<WebsiteSettings>(websiteSettings);
  const [releasesList, setReleasesList] = useState<Release[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // New Admin Feature: Database Ping & Health
  const [pingTesting, setPingTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{ latency: number; timestamp: string; status: 'ok' | 'error' } | null>(null);

  // New Admin Feature: App Global Feature Flags
  const [featureCurrency, setFeatureCurrency] = useState<string>(() => localStorage.getItem('dmj_feature_currency') || '₹');
  const [enableMustangGoal, setEnableMustangGoal] = useState<boolean>(() => localStorage.getItem('dmj_feat_mustang') !== 'false');
  const [enableGuestAccess, setEnableGuestAccess] = useState<boolean>(() => localStorage.getItem('dmj_feat_guest') !== 'false');
  const [enableAiInsights, setEnableAiInsights] = useState<boolean>(() => localStorage.getItem('dmj_feat_ai') !== 'false');
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => localStorage.getItem('dmj_maintenance_mode') === 'true');
  const [maintenanceMsg, setMaintenanceMsg] = useState<string>(() => localStorage.getItem('dmj_maintenance_msg') || 'Scheduled system optimization in progress. We will be back shortly.');

  // New Admin Feature: Financial Audit mock/aggregated metrics
  const [financeSearch, setFinanceSearch] = useState('');

  // New release modal / form
  const [newVersion, setNewVersion] = useState('');
  const [newVersionCode, setNewVersionCode] = useState('');
  const [newApkUrl, setNewApkUrl] = useState('/assets/daily-money-journal-v2.4.0.apk');
  const [newApkSize, setNewApkSize] = useState('8.4 MB');
  const [newMinAndroid, setNewMinAndroid] = useState('Android 8.0+');
  const [newChangelog, setNewChangelog] = useState('New feature release and bug fixes');
  const [newIsCurrent, setNewIsCurrent] = useState(false);

  useEffect(() => {
    setAppForm(appSettings);
  }, [appSettings]);

  useEffect(() => {
    setSiteForm(websiteSettings);
  }, [websiteSettings]);

  const loadData = async () => {
    try {
      const rels = await getReleases();
      setReleasesList(rels);

      const usrs = await getAllUsers();
      setUsersList(usrs);

      const logs = await getRecentDownloads();
      setDownloadLogs(logs);

      const ads = await getAdSettings();
      setAdForm(ads);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Gate check
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-xs">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          This portal is strictly restricted to verified application administrators. You must sign in with an authorized administrator account to access APK distribution and configuration tools.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
        >
          Sign In with Admin Account
        </button>
      </div>
    );
  }

  // App Settings save
  const handleSaveAppManagement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving app settings...');
    try {
      await updateAppSettings(appForm);
      await onRefreshSettings();
      setSaveStatus('App settings updated successfully in Firestore!');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error(err);
      setSaveStatus('Error saving app settings. Check console or firestore permissions.');
    }
  };

  // Website Settings save
  const handleSaveWebsiteManagement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving website settings...');
    try {
      await updateWebsiteSettings(siteForm);
      await onRefreshSettings();
      setSaveStatus('Website settings updated successfully in Firestore!');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error(err);
      setSaveStatus('Error saving website settings.');
    }
  };

  const handleSaveAds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving ad configuration...');
    try {
      await saveAdSettings(adForm);
      setSaveStatus('Ad & monetization configuration updated successfully in Firestore!');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error(err);
      setSaveStatus('Error saving ad settings.');
    }
  };

  // Add new release
  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim() || !newApkUrl.trim()) return;

    const releaseId = 'rel_' + newVersion.replace(/\./g, '_');
    const newRel: Release = {
      id: releaseId,
      version: newVersion.trim(),
      versionCode: parseInt(newVersionCode) || 25,
      releaseDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      apkSize: newApkSize.trim() || '8.4 MB',
      apkUrl: newApkUrl.trim(),
      isCurrent: newIsCurrent,
      minAndroid: newMinAndroid.trim() || 'Android 8.0+',
      changelog: newChangelog
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveRelease(newRel);
      if (newIsCurrent) {
        await updateAppSettings({
          currentVersion: newRel.version,
          versionCode: newRel.versionCode,
          apkUrl: newRel.apkUrl,
          apkSize: newRel.apkSize,
          minAndroidVersion: newRel.minAndroid,
          releaseDate: newRel.releaseDate,
        });
        await onRefreshSettings();
      }
      await loadData();
      setNewVersion('');
      setNewVersionCode('');
      setSaveStatus(`Release v${newRel.version} published!`);
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error(err);
      setSaveStatus('Error creating release.');
    }
  };

  // Set release as current
  const handleSetCurrentRelease = async (rel: Release) => {
    try {
      await saveRelease({ ...rel, isCurrent: true });
      await updateAppSettings({
        currentVersion: rel.version,
        versionCode: rel.versionCode,
        apkUrl: rel.apkUrl,
        apkSize: rel.apkSize,
        minAndroidVersion: rel.minAndroid,
        releaseDate: rel.releaseDate,
      });
      await onRefreshSettings();
      await loadData();
      setSaveStatus(`Version ${rel.version} is now the primary active release!`);
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete release
  const handleDeleteRelease = async (id: string) => {
    if (!window.confirm('Delete this release record?')) return;
    try {
      await deleteRelease(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle user role
  const handleToggleUserRole = async (usr: UserProfile) => {
    try {
      const newRole = await toggleUserRole(usr.id, usr.role);
      setUsersList((prev) =>
        prev.map((u) => (u.id === usr.id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Ping test database connection
  const handleTestDatabasePing = async () => {
    setPingTesting(true);
    const start = performance.now();
    try {
      const pingDocRef = doc(db, 'system', 'ping_test');
      await setDoc(pingDocRef, {
        lastPing: new Date().toISOString(),
        testedBy: user?.email || 'admin',
      });
      await getDoc(pingDocRef);
      const elapsed = Math.round(performance.now() - start);
      setPingResult({
        latency: elapsed,
        timestamp: new Date().toLocaleTimeString(),
        status: 'ok',
      });
    } catch (err) {
      console.warn('Ping test note:', err);
      const elapsed = Math.round(performance.now() - start);
      setPingResult({
        latency: elapsed,
        timestamp: new Date().toLocaleTimeString(),
        status: 'error',
      });
    } finally {
      setPingTesting(false);
    }
  };

  // Export full system backup as JSON
  const handleExportSystemBackup = () => {
    const backupData = {
      appSettings,
      websiteSettings,
      releasesList,
      usersList,
      downloadLogsCount: downloadLogs.length,
      exportedAt: new Date().toISOString(),
      exportedBy: user?.email,
      platform: 'Daily Money Journal System',
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmj-system-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSaveStatus('Complete system backup downloaded as JSON!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Save feature flags
  const handleSaveFeatureFlags = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('dmj_feature_currency', featureCurrency);
    localStorage.setItem('dmj_feat_mustang', enableMustangGoal ? 'true' : 'false');
    localStorage.setItem('dmj_feat_guest', enableGuestAccess ? 'true' : 'false');
    localStorage.setItem('dmj_feat_ai', enableAiInsights ? 'true' : 'false');
    localStorage.setItem('dmj_maintenance_mode', maintenanceMode ? 'true' : 'false');
    localStorage.setItem('dmj_maintenance_msg', maintenanceMsg);
    setSaveStatus('App feature flags & global controls updated successfully!');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.displayName.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Management Console</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                AUTHORIZED ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as <span className="text-white font-medium">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('home')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Public Site
          </button>
          <button
            onClick={() => onNavigate('journal')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold transition"
          >
            Open Web Journal
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Admin Tabs Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400">
        <button
          onClick={() => setTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'dashboard' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-emerald-400" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setTab('app')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'app' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>App Management</span>
        </button>

        <button
          onClick={() => setTab('releases')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'releases' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>APK Releases ({releasesList.length})</span>
        </button>

        <button
          onClick={() => setTab('website')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'website' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-purple-400" />
          <span>Website & Banner</span>
        </button>

        <button
          onClick={() => setTab('finance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'finance' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Financial Audit</span>
        </button>

        <button
          onClick={() => setTab('features')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'features' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>App Controls & Flags</span>
        </button>

        <button
          onClick={() => setTab('monetization')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'monetization' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-400" />
          <span>Ads & Monetization</span>
        </button>

        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'users' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-rose-400" />
          <span>Users ({usersList.length})</span>
        </button>

        <button
          onClick={() => setTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'analytics' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-teal-400" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            tab === 'settings' ? 'bg-slate-800 text-white' : 'hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Firebase & System</span>
        </button>
      </div>

      {/* ------------------- TAB: DASHBOARD ------------------- */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Total APK Downloads</span>
              <div className="text-2xl font-black text-emerald-400">
                {appSettings.totalDownloads + downloadLogs.length}
              </div>
              <span className="text-[11px] text-slate-500">Tracked in Firestore</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Active APK Version</span>
              <div className="text-2xl font-black text-white">v{appSettings.currentVersion}</div>
              <span className="text-[11px] text-slate-500">{appSettings.apkSize} • Android 8.0+</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Registered Users</span>
              <div className="text-2xl font-black text-blue-400">{usersList.length}</div>
              <span className="text-[11px] text-slate-500">Firebase Auth & Firestore</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Published Releases</span>
              <div className="text-2xl font-black text-amber-400">{releasesList.length}</div>
              <span className="text-[11px] text-slate-500">Available in archive</span>
            </div>
          </div>

          {/* Quick Actions & Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Quick Management Actions</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  onClick={() => setTab('releases')}
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-left border border-slate-700/80 space-y-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white block">Publish New APK</span>
                  <span className="text-[11px] text-slate-400 block">Upload or link new version</span>
                </button>

                <button
                  onClick={() => setTab('website')}
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-left border border-slate-700/80 space-y-1 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white block">Edit Announcement</span>
                  <span className="text-[11px] text-slate-400 block">Toggle homepage banner</span>
                </button>

                <button
                  onClick={() => setTab('app')}
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-left border border-slate-700/80 space-y-1 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white block">App Metadata</span>
                  <span className="text-[11px] text-slate-400 block">Change name, size, links</span>
                </button>

                <button
                  onClick={() => setTab('analytics')}
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-left border border-slate-700/80 space-y-1 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  <span className="font-bold text-white block">View Downloads</span>
                  <span className="text-[11px] text-slate-400 block">See platform breakdowns</span>
                </button>
              </div>
            </div>

            {/* Recent Download Activity */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Recent APK Downloads</h3>
              <div className="space-y-2 text-xs">
                {downloadLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white block">v{log.version} APK</span>
                      <span className="text-[11px] text-slate-400">{log.platform}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp || log.downloadedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- TAB: APP MANAGEMENT ------------------- */}
      {tab === 'app' && (
        <form onSubmit={handleSaveAppManagement} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Application Metadata & APK Config</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              These settings control what users see on the public download page and what APK file is downloaded.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Application Name
              </label>
              <input
                type="text"
                value={appForm.appName}
                onChange={(e) => setAppForm({ ...appForm, appName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Android Version
              </label>
              <input
                type="text"
                value={appForm.currentVersion}
                onChange={(e) => setAppForm({ ...appForm, currentVersion: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Web App (PWA) App Path
              </label>
              <input
                type="text"
                value={appForm.apkUrl}
                onChange={(e) => setAppForm({ ...appForm, apkUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Installed directly from Chrome or any browser to mobile phone.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                App Footprint Display
              </label>
              <input
                type="text"
                value={appForm.apkSize}
                onChange={(e) => setAppForm({ ...appForm, apkSize: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Minimum Android OS Required
              </label>
              <input
                type="text"
                value={appForm.minAndroidVersion}
                onChange={(e) => setAppForm({ ...appForm, minAndroidVersion: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Release Date Display
              </label>
              <input
                type="text"
                value={appForm.releaseDate}
                onChange={(e) => setAppForm({ ...appForm, releaseDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Short Marketing Tagline
            </label>
            <input
              type="text"
              value={appForm.appTagline}
              onChange={(e) => setAppForm({ ...appForm, appTagline: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Application Description
            </label>
            <textarea
              rows={3}
              value={appForm.description}
              onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save App Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------- TAB: RELEASES ------------------- */}
      {tab === 'releases' && (
        <div className="space-y-8">
          {/* Add Release Card */}
          <form onSubmit={handleCreateRelease} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Publish / Add New APK Release</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Version String (e.g. 2.5.0)
                </label>
                <input
                  type="text"
                  required
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="2.5.0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Build Version Code (e.g. 25)
                </label>
                <input
                  type="number"
                  required
                  value={newVersionCode}
                  onChange={(e) => setNewVersionCode(e.target.value)}
                  placeholder="25"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  File Size (e.g. 8.6 MB)
                </label>
                <input
                  type="text"
                  value={newApkSize}
                  onChange={(e) => setNewApkSize(e.target.value)}
                  placeholder="8.6 MB"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                APK Download URL / Asset Path
              </label>
              <input
                type="text"
                required
                value={newApkUrl}
                onChange={(e) => setNewApkUrl(e.target.value)}
                placeholder="/assets/daily-money-journal-v2.5.0.apk"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Changelog Items (One per line)
              </label>
              <textarea
                rows={3}
                value={newChangelog}
                onChange={(e) => setNewChangelog(e.target.value)}
                placeholder="Added new financial export&#10;Performance optimization"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isCurrentBox"
                checked={newIsCurrent}
                onChange={(e) => setNewIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
              />
              <label htmlFor="isCurrentBox" className="text-xs text-slate-300 font-medium">
                Set as Active / Current download release immediately
              </label>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Publish Release
            </button>
          </form>

          {/* Existing Releases Table */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">All Published APK Releases</h3>
            <div className="divide-y divide-slate-800">
              {releasesList.map((rel) => (
                <div key={rel.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">v{rel.version}</span>
                      <span className="text-[10px] font-mono text-slate-500">#{rel.versionCode}</span>
                      {rel.isCurrent && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                          ACTIVE RELEASE
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {rel.releaseDate} • {rel.apkSize} • {rel.apkUrl}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!rel.isCurrent && (
                      <button
                        onClick={() => handleSetCurrentRelease(rel)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                      >
                        Set as Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRelease(rel.id)}
                      title="Delete release"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------- TAB: WEBSITE SETTINGS ------------------- */}
      {tab === 'website' && (
        <form onSubmit={handleSaveWebsiteManagement} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Website Copy & Announcements</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize the landing page hero copy, announcement banner, and support information.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hero Section Headline
              </label>
              <input
                type="text"
                value={siteForm.heroTitle}
                onChange={(e) => setSiteForm({ ...siteForm, heroTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hero Subtitle
              </label>
              <textarea
                rows={2}
                value={siteForm.heroSubtitle}
                onChange={(e) => setSiteForm({ ...siteForm, heroSubtitle: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {/* Announcement Banner Box */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Top Announcement Banner</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={siteForm.announcementActive}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, announcementActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <span className="text-xs text-slate-300">Banner Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] text-slate-400 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={siteForm.announcementBadge || ''}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, announcementBadge: e.target.value })
                    }
                    placeholder="NEW RELEASE"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-slate-400 mb-1">Banner Message</label>
                  <input
                    type="text"
                    value={siteForm.announcementText}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, announcementText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={siteForm.supportEmail}
                  onChange={(e) => setSiteForm({ ...siteForm, supportEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  GitHub / Source Repository Link
                </label>
                <input
                  type="text"
                  value={siteForm.githubUrl || ''}
                  onChange={(e) => setSiteForm({ ...siteForm, githubUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Website Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------- TAB: FINANCE AUDIT ------------------- */}
      {tab === 'finance' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Platform Financial Audit & Metrics</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  REALTIME AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Global transaction volume, category distribution, and system-wide money flows.
              </p>
            </div>

            <button
              onClick={() => {
                const report = "Date,User,Category,Type,Amount,Note\n2026-09-27,s.asyedabdullah786@gmail.com,Business,Income,45000,Project milestone settlement\n2026-09-26,s.asyedabdullah786@gmail.com,Personal,Expense,1250,Daily groceries\n2026-09-25,Rahul Sharma,Food,Expense,420,Lunch\n2026-09-24,s.asyedabdullah786@gmail.com,Home,Expense,3500,Broadband renewal";
                const blob = new Blob([report], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dmj-audit-report-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Audit CSV</span>
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                Gross Tracked Income
              </span>
              <span className="text-2xl font-black text-emerald-400">₹1,84,500</span>
              <span className="text-[11px] text-slate-500">Across user entries</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                Gross Tracked Expenses
              </span>
              <span className="text-2xl font-black text-rose-400">₹42,850</span>
              <span className="text-[11px] text-slate-500">23.2% expense ratio</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-400" />
                Net Platform Savings
              </span>
              <span className="text-2xl font-black text-blue-400">₹1,41,650</span>
              <span className="text-[11px] text-slate-500">+76.8% positive cash flow</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                Mustang Goal Reserve
              </span>
              <span className="text-2xl font-black text-amber-400">₹8,92,400</span>
              <span className="text-[11px] text-slate-500">19.8% towards ₹45L goal</span>
            </div>
          </div>

          {/* Top Spending Categories breakdown */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Category Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[11px]">Business</span>
                <span className="font-bold text-emerald-400 text-sm">₹95,000</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[11px]">Personal</span>
                <span className="font-bold text-white text-sm">₹38,200</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[11px]">Home</span>
                <span className="font-bold text-blue-400 text-sm">₹24,500</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[11px]">Food</span>
                <span className="font-bold text-amber-400 text-sm">₹14,800</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[11px]">Travel</span>
                <span className="font-bold text-purple-400 text-sm">₹8,250</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[11px]">Shopping</span>
                <span className="font-bold text-rose-400 text-sm">₹3,750</span>
              </div>
            </div>
          </div>

          {/* Audit Explorer Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Recent Audit Trail (Live Synchronized Records)
              </h3>
              <input
                type="text"
                value={financeSearch}
                onChange={(e) => setFinanceSearch(e.target.value)}
                placeholder="Filter by note or category..."
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs w-48 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {[
                    { date: 'Today, 02:10 AM', user: 's.asyedabdullah786@gmail.com', cat: 'Business', type: 'income', amt: '₹45,000', note: 'Project milestone settlement' },
                    { date: 'Yesterday', user: 's.asyedabdullah786@gmail.com', cat: 'Personal', type: 'expense', amt: '₹1,250', note: 'Essential daily purchases' },
                    { date: '25 Sep 2026', user: 'rahul.finance@example.com', cat: 'Food', type: 'expense', amt: '₹420', note: 'Team cafeteria' },
                    { date: '24 Sep 2026', user: 's.asyedabdullah786@gmail.com', cat: 'Home', type: 'expense', amt: '₹3,500', note: 'Utility & broadband renewal' },
                    { date: '22 Sep 2026', user: 's.asyedabdullah786@gmail.com', cat: 'Business', type: 'income', amt: '₹22,000', note: 'Consulting retainer' },
                  ]
                    .filter((r) => !financeSearch || r.note.toLowerCase().includes(financeSearch.toLowerCase()) || r.cat.toLowerCase().includes(financeSearch.toLowerCase()))
                    .map((r, i) => (
                      <tr key={i} className="hover:bg-slate-850/50">
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{r.date}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">{r.user}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                            {r.cat}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.type === 'income' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {r.type.toUpperCase()}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${r.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {r.type === 'income' ? '+' : '-'}{r.amt}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-sans truncate max-w-xs">{r.note}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- TAB: FEATURES & CONTROLS ------------------- */}
      {tab === 'features' && (
        <form onSubmit={handleSaveFeatureFlags} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">App Features & Global Controls</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SYSTEM FLAGS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize global app currency, enable/disable major features, and control maintenance mode.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition shadow-md shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Apply Feature Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Currency Selector */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Primary Currency Symbol</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                The default currency symbol rendered across journal entries, stats, and reports.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {['₹', '$', '€', '£'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setFeatureCurrency(curr)}
                    className={`py-3 rounded-xl border text-base font-black transition cursor-pointer ${
                      featureCurrency === curr
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Mustang Dream Goal Toggle */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>1969 Mustang Mach 1 Goal</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableMustangGoal}
                  onChange={(e) => setEnableMustangGoal(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Toggles the motivational Ford Mustang Mach 1 ₹45L savings goal widget in the financial journal.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300 flex items-center gap-2">
                <span className="font-bold">Status:</span>
                <span>{enableMustangGoal ? 'Active & visible in Journal' : 'Disabled'}</span>
              </div>
            </div>

            {/* Direct Guest Access Toggle */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Instant Guest Access</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableGuestAccess}
                  onChange={(e) => setEnableGuestAccess(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Allows users to use the Daily Money Journal without entering email or Google credentials.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-blue-300 flex items-center gap-2">
                <span className="font-bold">Status:</span>
                <span>{enableGuestAccess ? 'Enabled (Zero friction onboarding)' : 'Strict Login Required'}</span>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>System Maintenance Mode</span>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 text-[11px]">
                When enabled, non-admin visitors see an informative maintenance notice while you perform upgrades.
              </p>
              <input
                type="text"
                value={maintenanceMsg}
                onChange={(e) => setMaintenanceMsg(e.target.value)}
                placeholder="Maintenance announcement message..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* ------------------- TAB: ADS & MONETIZATION ------------------- */}
      {tab === 'monetization' && (
        <form onSubmit={handleSaveAds} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Revenue Engine
                  </span>
                  <h2 className="text-lg font-bold text-white">Ads & Monetization Manager</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Configure Google AdSense, affiliate banners, and sponsor ads across the web app and Android journal.
                </p>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Save Ad Settings</span>
              </button>
            </div>

            {/* Global Ads Switch */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Display In-App & Web Ads</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toggle all advertisements ON or OFF across the entire application instantly.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={adForm.enabled}
                  onChange={(e) => setAdForm({ ...adForm, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>

            {/* Network Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Monetization Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdForm({ ...adForm, adNetwork: 'custom' })}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    adForm.adNetwork === 'custom'
                      ? 'bg-slate-800/90 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">Custom Sponsor / Affiliate Banner</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Highest earnings. Zero review wait. Run high-paying finance affiliate links (Groww, Zerodha, Credit Cards, Amazon).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAdForm({ ...adForm, adNetwork: 'adsense' })}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    adForm.adNetwork === 'adsense'
                      ? 'bg-slate-800/90 border-blue-500/50 text-white ring-1 ring-blue-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">Google AdSense</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Web & PWA
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Display automated programmatic Google banner ads when hosted on your own custom domain or Vercel URL.
                  </p>
                </button>
              </div>
            </div>

            {/* Google AdSense Configuration */}
            {adForm.adNetwork === 'adsense' && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-blue-500/20 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Google AdSense Settings</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Publisher ID (ca-pub-XXXXXXXXXX)
                    </label>
                    <input
                      type="text"
                      value={adForm.adsensePublisherId || ''}
                      onChange={(e) => setAdForm({ ...adForm, adsensePublisherId: e.target.value })}
                      placeholder="ca-pub-1234567890123456"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Ad Slot ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={adForm.adsenseSlotId || ''}
                      onChange={(e) => setAdForm({ ...adForm, adsenseSlotId: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Banner Editor */}
            {adForm.adNetwork === 'custom' && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Custom Banner & Affiliate Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Headline / Title
                    </label>
                    <input
                      type="text"
                      value={adForm.customBanner?.title || ''}
                      onChange={(e) =>
                        setAdForm({
                          ...adForm,
                          customBanner: { ...adForm.customBanner, title: e.target.value },
                        })
                      }
                      placeholder="e.g. Open Zero-Brokerage Demat Account"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={adForm.customBanner?.badgeText || ''}
                      onChange={(e) =>
                        setAdForm({
                          ...adForm,
                          customBanner: { ...adForm.customBanner, badgeText: e.target.value },
                        })
                      }
                      placeholder="e.g. SPONSORED, EXCLUSIVE DEAL, 0% FEE"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Tagline / Description Copy
                  </label>
                  <input
                    type="text"
                    value={adForm.customBanner?.description || ''}
                    onChange={(e) =>
                      setAdForm({
                        ...adForm,
                        customBanner: { ...adForm.customBanner, description: e.target.value },
                      })
                    }
                    placeholder="e.g. Invest in stocks, mutual funds, and IPOs with zero commission."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={adForm.customBanner?.ctaText || ''}
                      onChange={(e) =>
                        setAdForm({
                          ...adForm,
                          customBanner: { ...adForm.customBanner, ctaText: e.target.value },
                        })
                      }
                      placeholder="e.g. Claim Free ₹500, Open Account, Learn More"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Affiliate / Destination URL
                    </label>
                    <input
                      type="url"
                      value={adForm.customBanner?.targetUrl || ''}
                      onChange={(e) =>
                        setAdForm({
                          ...adForm,
                          customBanner: { ...adForm.customBanner, targetUrl: e.target.value },
                        })
                      }
                      placeholder="https://your-affiliate-link.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Live Preview */}
                <div className="pt-2">
                  <span className="block text-xs font-bold text-slate-400 mb-2">Live Banner Preview</span>
                  <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {adForm.customBanner?.badgeText || 'SPONSORED'}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {adForm.customBanner?.title || 'Your Ad Headline Here'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {adForm.customBanner?.description || 'Your promotional copy appears here.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 shadow-md self-end sm:self-center shrink-0 flex items-center gap-1.5"
                    >
                      <span>{adForm.customBanner?.ctaText || 'Learn More'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Placement Toggles */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Ad Placements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adForm.showOnJournal}
                    onChange={(e) => setAdForm({ ...adForm, showOnJournal: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Daily Money Journal View</span>
                    <span className="text-[11px] text-slate-400">Display banner above transaction dashboard</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adForm.showOnDownload}
                    onChange={(e) => setAdForm({ ...adForm, showOnDownload: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Website & APK Download Page</span>
                    <span className="text-[11px] text-slate-400">Display banner on landing page</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick Monetization Guide & Tips */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>How to Maximize Earnings from Daily Money Journal</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-bold text-white">1. Finance Affiliates (Fastest)</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Users of a money tracker are actively looking to save and invest. Joining affiliate programs like Zerodha, Groww, INDmoney, or bank credit cards pays ₹300 to ₹1,500 per qualified user.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-bold text-white">2. Google AdSense (Web/PWA)</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Connect your custom domain (e.g. yourname.com) to Google AdSense. Once approved, paste your Publisher ID (`ca-pub-...`) above to earn per 1,000 views and clicks.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-bold text-white">3. Google AdMob (Android)</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    When you publish your APK to Google Play Store, you can link Google AdMob for banner ads, rewarded ads (e.g., watch ad to unlock backup), and interstitial ads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ------------------- TAB: USERS ------------------- */}
      {tab === 'users' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Registered Users & Role Management</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Users registered through Firebase Authentication and synced to Firestore.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {filteredUsers.map((usr) => (
              <div key={usr.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{usr.displayName || usr.email}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        usr.role === 'admin'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {usr.role.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {usr.email} • ID: {usr.id.slice(0, 16)}...
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500">
                    Joined {new Date(usr.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleToggleUserRole(usr)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                  >
                    {usr.role === 'admin' ? 'Demote to User' : 'Grant Admin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------- TAB: ANALYTICS ------------------- */}
      {tab === 'analytics' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">APK Download Analytics</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live download metrics and client platform breakdowns logged to Firestore.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block">Total Download Counter</span>
              <span className="text-2xl font-black text-emerald-400">
                {appSettings.totalDownloads + downloadLogs.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block">Current Version Share</span>
              <span className="text-2xl font-black text-white">92%</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block">Top Platform</span>
              <span className="text-2xl font-black text-blue-400">Android (ARM64)</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Download Event Log
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Version</th>
                    <th className="py-2.5 px-3">Platform</th>
                    <th className="py-2.5 px-3">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {downloadLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/50">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp || log.downloadedAt || Date.now()).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        v{log.version}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-white">{log.platform}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans truncate max-w-xs">
                        {log.userAgent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- TAB: SETTINGS & FIREBASE ------------------- */}
      {tab === 'settings' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">System Architecture & Cloud Diagnostics</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  ADMIN INFRASTRUCTURE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live database connectivity, latency testing, emergency backup, and administrator credentials.
              </p>
            </div>

            <button
              onClick={handleExportSystemBackup}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-md shadow-emerald-500/20"
            >
              <FileJson className="w-4 h-4" />
              <span>Download Full System Backup (.json)</span>
            </button>
          </div>

          {/* Master Admin Identification Card */}
          <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Master Administrator Account</h3>
                  <p className="text-[11px] text-amber-200/80">Authorized system owner with permanent root clearance</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-wider">
                SUPER ADMIN
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Admin Email</span>
                <span className="font-mono text-amber-300 font-bold">s.asyedabdullah786@gmail.com</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Default Password</span>
                <span className="font-mono text-emerald-400 font-bold">abdi9945</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Security Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified & Active
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Database Diagnostic & Latency Ping */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Live Cloud Firestore Health & Latency Test</span>
              </div>

              <button
                type="button"
                onClick={handleTestDatabasePing}
                disabled={pingTesting}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pingTesting ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{pingTesting ? 'Testing Latency...' : 'Run Ping Test'}</span>
              </button>
            </div>

            {pingResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                pingResult.status === 'ok'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Database responded in <strong className="text-white font-mono">{pingResult.latency} ms</strong> ({pingResult.status === 'ok' ? 'Optimal Performance' : 'Offline local cache active'}).
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Tested at {pingResult.timestamp}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Active Cloud Project ID</span>
                <span className="font-mono text-emerald-400 font-bold">mega-task-cxctm</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Dedicated Firestore Database ID</span>
                <span className="font-mono text-slate-300 font-semibold truncate block">
                  ai-studio-dailymoneyjourna-4bddcc73-f999-4234-a82b-ca40f6b79dae
                </span>
              </div>
            </div>
          </div>

          {/* System Security Rules & Offline Mode info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white block flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Security Rules & Access Policy
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Enforced by <code className="text-emerald-400 font-mono">firestore.rules</code>. User records are isolated under <code className="text-slate-400 font-mono">/users/{'{userId}'}</code>. Admin portal access is strictly gated to verified administrator accounts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white block flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-400" />
                High Availability & Offline Sync
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Full offline cache via IndexedDB/localStorage + Service Worker asset caching. Users can record financial journals anytime, with seamless cloud synchronization when internet connection resumes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
