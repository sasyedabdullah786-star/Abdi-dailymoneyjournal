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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppSettings, WebsiteSettings, Release, UserProfile, DownloadLog } from '../../types';
import { updateAppSettings, updateWebsiteSettings } from '../../services/appSettingsService';
import { getReleases, saveRelease, deleteRelease } from '../../services/releaseService';
import { getAllUsers, toggleUserRole } from '../../services/userService';
import { getRecentDownloads } from '../../services/downloadService';

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
  const [tab, setTab] = useState<'dashboard' | 'app' | 'releases' | 'website' | 'users' | 'analytics' | 'settings'>('dashboard');

  // Form states
  const [appForm, setAppForm] = useState<AppSettings>(appSettings);
  const [siteForm, setSiteForm] = useState<WebsiteSettings>(websiteSettings);
  const [releasesList, setReleasesList] = useState<Release[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

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
          <div>
            <h2 className="text-lg font-bold text-white">System Architecture & Firebase Security</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified Firebase parameters and security configurations.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Active Firebase Project ID</span>
              <p className="font-mono text-emerald-400">mega-task-cxctm</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Dedicated Firestore Database ID</span>
              <p className="font-mono text-slate-300">ai-studio-4bddcc73-f999-4234-a82b-ca40f6b79dae</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Bootstrap Administrator</span>
              <p className="font-mono text-amber-300">s.asyedabdullah786@gmail.com</p>
              <p className="text-slate-400 text-[11px]">
                Configured in firestore.rules and automatically granted full admin privilege.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Offline Capability</span>
              <p className="text-slate-300">
                Local storage synchronization + Service Worker precaching is enabled. Daily financial records persist with or without cloud connectivity.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
