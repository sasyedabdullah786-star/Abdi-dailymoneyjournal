import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getTodayDateKey,
  formatINR,
  formatHumanDate,
  subscribeToUserEntries,
  addMoneyEntryToFirestore,
  deleteMoneyEntryFromFirestore,
  subscribeToUserPending,
  addPendingItemToFirestore,
  deletePendingItemFromFirestore,
  getUserNotesFromFirestore,
  saveUserNotesToFirestore,
} from '../services/journalService';
import { MoneyEntry, PendingItem } from '../types';
import { SimpleAuthModal } from './SimpleAuthModal';

const CATEGORIES = [
  'Personal',
  'Home',
  'Business',
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Customer',
  'Other',
];

const LOCAL_ENTRIES_KEY = 'daily_money_journal_local_entries';
const LOCAL_PENDING_KEY = 'daily_money_journal_local_pending';
const LOCAL_NOTES_KEY = 'daily_money_journal_local_notes';

interface Props {
  onOpenDownload: () => void;
  onOpenAdmin: () => void;
}

export const DailyMoneyJournalApp: React.FC<Props> = ({
  onOpenDownload,
  onOpenAdmin,
}) => {
  const { user, isAdmin, logout } = useAuth();

  // Navigation pages: 'home' | 'history' | 'history-detail' | 'pending' | 'notes' | 'mustang'
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Today date
  const [dateText, setDateText] = useState('');
  const [todayDateKey, setTodayDateKey] = useState(getTodayDateKey());

  // Entries
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('income');
  const [amountInput, setAmountInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');

  // History
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);

  // Pending Money
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [pendingType, setPendingType] = useState<'receive' | 'pay'>('receive');
  const [pendingAmount, setPendingAmount] = useState('');
  const [pendingDescription, setPendingDescription] = useState('');

  // Smart Notes
  const [notesText, setNotesText] = useState('');
  const [notesFeedback, setNotesFeedback] = useState<string | null>(null);

  // Date format updater
  useEffect(() => {
    const updateDate = () => {
      const d = new Date();
      setDateText(
        d.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
      setTodayDateKey(getTodayDateKey());
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync Entries with Firestore or LocalStorage
  useEffect(() => {
    if (user) {
      // Subscribed to user's real Firestore subcollection: users/{uid}/entries
      const unsubscribe = subscribeToUserEntries(user.uid, (data) => {
        setEntries(data);
      });
      return () => unsubscribe();
    } else {
      // Fallback guest storage
      try {
        const raw = localStorage.getItem(LOCAL_ENTRIES_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        setEntries(Array.isArray(parsed) ? parsed.filter((e: MoneyEntry) => !e.id?.startsWith('entry_seed_')) : []);
      } catch {
        setEntries([]);
      }
    }
  }, [user]);

  // Sync Pending Items with Firestore or LocalStorage
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToUserPending(user.uid, (data) => {
        setPendingItems(data);
      });
      return () => unsubscribe();
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_PENDING_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        setPendingItems(Array.isArray(parsed) ? parsed.filter((p: PendingItem) => !p.id?.startsWith('pend_seed_')) : []);
      } catch {
        setPendingItems([]);
      }
    }
  }, [user]);

  // Load Notes
  useEffect(() => {
    if (user) {
      getUserNotesFromFirestore(user.uid).then((text: string) => setNotesText(text));
    } else {
      const rawNotes = localStorage.getItem(LOCAL_NOTES_KEY) || '';
      if (rawNotes.includes('Remember to collect shop rent on the 1st')) {
        localStorage.removeItem(LOCAL_NOTES_KEY);
        setNotesText('');
      } else {
        setNotesText(rawNotes);
      }
    }
  }, [user]);

  // Compute Today's Income, Expense, and Balance
  const todayEntries = entries.filter((e) => e.date === todayDateKey);
  const incomeTotal = todayEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const expenseTotal = todayEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = incomeTotal - expenseTotal;

  // Add Money Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountInput);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!descriptionInput.trim()) {
      alert('Please enter a description.');
      return;
    }

    const now = new Date();
    const newEntryPayload = {
      type: selectedType,
      amount: parsedAmount,
      description: descriptionInput.trim(),
      category: categoryInput,
      date: todayDateKey,
      time: now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    if (user) {
      // Save directly to Firebase Firestore
      await addMoneyEntryToFirestore(user.uid, newEntryPayload);
    } else {
      // Save to local storage for guest
      const newEntry: MoneyEntry = {
        ...newEntryPayload,
        id: 'local_' + Date.now(),
        createdAt: now.toISOString(),
      };
      const updated = [newEntry, ...entries];
      setEntries(updated);
      localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(updated));
    }

    setAmountInput('');
    setDescriptionInput('');
  };

  // Delete Entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return;

    if (user) {
      await deleteMoneyEntryFromFirestore(user.uid, entryId);
    } else {
      const updated = entries.filter((e) => e.id !== entryId);
      setEntries(updated);
      localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(updated));
    }
  };

  // Quick Amount preset handler
  const handleQuickAmount = (val: number) => {
    setAmountInput(String(val));
  };

  // Daily History: get list of unique historical dates
  const historyDates = Array.from(new Set(entries.map((e) => e.date))).sort().reverse();
  const historyEntriesForSelectedDate = entries.filter(
    (e) => e.date === selectedHistoryDate
  );

  // Add Pending Item
  const handleAddPending = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(pendingAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Enter valid amount.');
      return;
    }
    if (!pendingDescription.trim()) {
      alert('Enter description.');
      return;
    }

    const payload = {
      type: pendingType,
      amount: parsedAmount,
      description: pendingDescription.trim(),
    };

    if (user) {
      await addPendingItemToFirestore(user.uid, payload);
    } else {
      const newItem: PendingItem = {
        ...payload,
        id: 'pend_' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newItem, ...pendingItems];
      setPendingItems(updated);
      localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(updated));
    }

    setPendingAmount('');
    setPendingDescription('');
  };

  // Mark Pending Received or Paid -> Automatically moves into Today's Entries!
  const handleCompletePending = async (item: PendingItem) => {
    const now = new Date();
    const entryPayload = {
      type: item.type === 'receive' ? ('income' as const) : ('expense' as const),
      amount: item.amount,
      description: item.description + ' (Pending Settled)',
      category: 'Pending Payment',
      date: todayDateKey,
      time: now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    if (user) {
      await addMoneyEntryToFirestore(user.uid, entryPayload);
      await deletePendingItemFromFirestore(user.uid, item.id);
    } else {
      const updatedPending = pendingItems.filter((p) => p.id !== item.id);
      setPendingItems(updatedPending);
      localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(updatedPending));

      const newEntry: MoneyEntry = {
        ...entryPayload,
        id: 'local_' + Date.now(),
        createdAt: now.toISOString(),
      };
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(updatedEntries));
    }
  };

  // Delete Pending without settling
  const handleDeletePending = async (id: string) => {
    if (user) {
      await deletePendingItemFromFirestore(user.uid, id);
    } else {
      const updated = pendingItems.filter((p) => p.id !== id);
      setPendingItems(updated);
      localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(updated));
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (user) {
      await saveUserNotesToFirestore(user.uid, notesText);
    } else {
      localStorage.setItem(LOCAL_NOTES_KEY, notesText);
    }
    setNotesFeedback('Smart notes saved!');
    setTimeout(() => setNotesFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f3f5f9] text-[#111827] font-sans antialiased selection:bg-[#16a34a] selection:text-white">
      <SimpleAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Main Container - Exact Mobile Frame Style */}
      <div className="max-w-[500px] mx-auto p-4 pb-16">
        {/* Top Header */}
        <div className="relative flex justify-between items-center mb-5">
          <div>
            <h1 className="text-[27px] font-bold tracking-tight text-[#111827] leading-tight">
              Daily Money Journal
            </h1>
            <p className="text-[13px] text-[#6b7280] mt-1 font-medium">
              {dateText || 'Loading...'}
            </p>
          </div>

          {/* Circular Three-dot Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-12 h-12 rounded-full bg-white shadow-[0_3px_12px_rgba(0,0,0,0.08)] flex items-center justify-center text-2xl font-bold cursor-pointer hover:bg-gray-50 active:scale-95 transition"
            >
              ⋮
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                className="absolute right-0 top-14 w-60 bg-white rounded-[18px] p-2 shadow-[0_15px_40px_rgba(0,0,0,0.18)] z-50 border border-gray-100 animate-in fade-in"
                onClick={() => setMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setCurrentPage('home')}
                  className="w-full text-left p-3.5 rounded-[10px] text-[15px] font-medium hover:bg-[#f1f5f9] transition cursor-pointer flex items-center gap-2"
                >
                  🏠 Home
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('history')}
                  className="w-full text-left p-3.5 rounded-[10px] text-[15px] font-medium hover:bg-[#f1f5f9] transition cursor-pointer flex items-center gap-2"
                >
                  📚 Daily History
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('pending')}
                  className="w-full text-left p-3.5 rounded-[10px] text-[15px] font-medium hover:bg-[#f1f5f9] transition cursor-pointer flex items-center gap-2"
                >
                  ⏳ Pending Money
                  {pendingItems.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      {pendingItems.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('notes')}
                  className="w-full text-left p-3.5 rounded-[10px] text-[15px] font-medium hover:bg-[#f1f5f9] transition cursor-pointer flex items-center gap-2"
                >
                  📝 Smart Notes
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('mustang')}
                  className="w-full text-left p-3.5 rounded-[10px] text-[15px] font-medium hover:bg-[#f1f5f9] transition cursor-pointer flex items-center gap-2"
                >
                  🐎 Mustang
                </button>

                <div className="border-t border-gray-100 my-1" />

                <button
                  type="button"
                  onClick={onOpenDownload}
                  className="w-full text-left p-3.5 rounded-[10px] text-[15px] font-bold text-blue-600 hover:bg-blue-50 transition cursor-pointer flex items-center gap-2"
                >
                  📥 Download Android App
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="w-full text-left p-3.5 rounded-[10px] text-[15px] font-bold text-amber-700 hover:bg-amber-50 transition cursor-pointer flex items-center gap-2"
                  >
                    ⚙️ Admin Panel
                  </button>
                )}

                {user ? (
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full text-left p-3.5 rounded-[10px] text-[14px] text-red-600 hover:bg-red-50 transition cursor-pointer flex items-center gap-2"
                  >
                    🚪 Sign Out ({user.email?.split('@')[0]})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full text-left p-3.5 rounded-[10px] text-[14px] font-bold text-[#111827] hover:bg-[#f1f5f9] transition cursor-pointer flex items-center gap-2"
                  >
                    🔑 Log In / Sign Up
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Guest Data Protection Banner */}
        {!user && (
          <div
            onClick={() => setAuthModalOpen(true)}
            className="mb-3.5 p-3 rounded-[16px] bg-white border border-blue-100 shadow-sm flex items-center justify-between text-xs text-gray-700 cursor-pointer hover:bg-blue-50/50 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🔐</span>
              <span>Protect your data — <strong>Continue with Google</strong> or Email</span>
            </div>
            <span className="text-blue-600 font-bold group-hover:underline">Sign In →</span>
          </div>
        )}

        {/* ----------------- PAGE: HOME ----------------- */}
        {currentPage === 'home' && (
          <div>
            {/* Balance Card */}
            <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#111827] to-[#334155] text-white mb-3.5 shadow-md">
              <small className="text-[#cbd5e1] font-semibold text-xs tracking-wider">
                CURRENT BALANCE
              </small>
              <h2 className="text-[38px] font-bold mt-2 leading-none">
                {formatINR(balance)}
              </h2>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3.5">
              <div className="bg-white rounded-[18px] p-4 shadow-sm">
                <p className="text-[#6b7280] text-[13px] font-medium">Money Received</p>
                <h3 className="text-[#16a34a] text-[21px] font-bold mt-1.5">
                  {formatINR(incomeTotal)}
                </h3>
              </div>
              <div className="bg-white rounded-[18px] p-4 shadow-sm">
                <p className="text-[#6b7280] text-[13px] font-medium">Money Spent</p>
                <h3 className="text-[#dc2626] text-[21px] font-bold mt-1.5">
                  {formatINR(expenseTotal)}
                </h3>
              </div>
            </div>

            {/* Quick Entry */}
            <div className="bg-white rounded-[20px] p-5 mb-3.5 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#111827] mb-4">⚡ Quick Entry</h2>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(50)}
                  className="py-3 px-1 rounded-[10px] bg-[#eef2ff] text-[#1e40af] font-bold text-center text-sm cursor-pointer hover:bg-[#e0e7ff] transition"
                >
                  ₹50
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(100)}
                  className="py-3 px-1 rounded-[10px] bg-[#eef2ff] text-[#1e40af] font-bold text-center text-sm cursor-pointer hover:bg-[#e0e7ff] transition"
                >
                  ₹100
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(200)}
                  className="py-3 px-1 rounded-[10px] bg-[#eef2ff] text-[#1e40af] font-bold text-center text-sm cursor-pointer hover:bg-[#e0e7ff] transition"
                >
                  ₹200
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(500)}
                  className="py-3 px-1 rounded-[10px] bg-[#eef2ff] text-[#1e40af] font-bold text-center text-sm cursor-pointer hover:bg-[#e0e7ff] transition"
                >
                  ₹500
                </button>
              </div>
            </div>

            {/* Add Money Entry */}
            <div className="bg-white rounded-[20px] p-5 mb-3.5 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#111827] mb-4">Add Money Entry</h2>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedType('income')}
                  className={`p-3.5 rounded-[13px] font-bold text-sm border-2 transition cursor-pointer ${
                    selectedType === 'income'
                      ? 'bg-[#ecfdf5] border-[#16a34a] text-[#16a34a]'
                      : 'bg-white border-[#e5e7eb] text-[#374151]'
                  }`}
                >
                  ➕ MONEY IN
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('expense')}
                  className={`p-3.5 rounded-[13px] font-bold text-sm border-2 transition cursor-pointer ${
                    selectedType === 'expense'
                      ? 'bg-[#fef2f2] border-[#dc2626] text-[#dc2626]'
                      : 'bg-white border-[#e5e7eb] text-[#374151]'
                  }`}
                >
                  ➖ MONEY OUT
                </button>
              </div>

              <form onSubmit={handleSaveEntry}>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-4 border border-[#e5e7eb] rounded-[12px] text-base mb-3 bg-white outline-none focus:border-[#111827] text-[#111827]"
                />

                <input
                  type="text"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="What is this money for?"
                  className="w-full p-4 border border-[#e5e7eb] rounded-[12px] text-base mb-3 bg-white outline-none focus:border-[#111827] text-[#111827]"
                />

                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full p-4 border border-[#e5e7eb] rounded-[12px] text-base mb-3 bg-white outline-none focus:border-[#111827] text-[#111827]"
                >
                  <option value="">Select category (optional)</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="w-full p-4 rounded-[13px] bg-[#111827] hover:bg-[#1f2937] text-white font-bold text-base transition cursor-pointer mt-1"
                >
                  SAVE ENTRY
                </button>
              </form>
            </div>

            {/* Today's Entries */}
            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#111827] mb-4">Today's Entries</h2>

              {todayEntries.length === 0 ? (
                <div className="p-6 text-center text-[#6b7280] text-sm">
                  No entries today.
                </div>
              ) : (
                <div className="divide-y divide-[#e5e7eb]">
                  {todayEntries.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex justify-between items-center gap-2.5"
                    >
                      <div>
                        <div className="font-bold text-[#111827] text-base">
                          {item.description}
                        </div>
                        <div className="text-[#6b7280] text-xs mt-1">
                          {item.category} • {item.time}
                        </div>
                      </div>

                      <div className="text-right">
                        <strong
                          className={`text-base font-bold block ${
                            item.type === 'income' ? 'text-[#16a34a]' : 'text-[#dc2626]'
                          }`}
                        >
                          {item.type === 'income' ? '+' : '-'}
                          {formatINR(item.amount)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(item.id)}
                          className="mt-1.5 px-2.5 py-1 rounded-[7px] text-xs font-semibold text-[#b91c1c] bg-[#fee2e2] hover:bg-[#fecaca] transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- PAGE: DAILY HISTORY ----------------- */}
        {currentPage === 'history' && (
          <div>
            <button
              type="button"
              onClick={() => setCurrentPage('home')}
              className="border-none py-2.5 px-4 rounded-[10px] mb-3.5 cursor-pointer bg-[#e5e7eb] hover:bg-[#d1d5db] text-sm font-bold text-[#374151]"
            >
              ← Back
            </button>

            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#111827] mb-4">Daily History</h2>

              {historyDates.length === 0 ? (
                <div className="p-6 text-center text-[#6b7280] text-sm">
                  No history found.
                </div>
              ) : (
                <div className="space-y-2">
                  {historyDates.map((dateStr) => {
                    const dayItems = entries.filter((e) => e.date === dateStr);
                    const dayIn = dayItems
                      .filter((e) => e.type === 'income')
                      .reduce((s, e) => s + e.amount, 0);
                    const dayOut = dayItems
                      .filter((e) => e.type === 'expense')
                      .reduce((s, e) => s + e.amount, 0);

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedHistoryDate(dateStr);
                          setCurrentPage('history-detail');
                        }}
                        className="w-full text-left p-4 bg-[#f8fafc] hover:bg-[#f1f5f9] rounded-[12px] cursor-pointer font-bold flex justify-between items-center transition"
                      >
                        <span>📅 {dateStr}</span>
                        <span className="text-xs">
                          <span className="text-[#16a34a] mr-2">+{formatINR(dayIn)}</span>
                          <span className="text-[#dc2626]">-{formatINR(dayOut)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- PAGE: HISTORY DETAIL ----------------- */}
        {currentPage === 'history-detail' && selectedHistoryDate && (
          <div>
            <button
              type="button"
              onClick={() => setCurrentPage('history')}
              className="border-none py-2.5 px-4 rounded-[10px] mb-3.5 cursor-pointer bg-[#e5e7eb] hover:bg-[#d1d5db] text-sm font-bold text-[#374151]"
            >
              ← History
            </button>

            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#111827] mb-4">
                History - {selectedHistoryDate}
              </h2>

              {historyEntriesForSelectedDate.length === 0 ? (
                <div className="p-6 text-center text-[#6b7280] text-sm">
                  No entries on this date.
                </div>
              ) : (
                <div className="divide-y divide-[#e5e7eb]">
                  {historyEntriesForSelectedDate.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex justify-between items-center gap-2.5"
                    >
                      <div>
                        <div className="font-bold text-[#111827] text-base">
                          {item.description}
                        </div>
                        <div className="text-[#6b7280] text-xs mt-1">
                          {item.category} • {item.time}
                        </div>
                      </div>

                      <strong
                        className={`text-base font-bold ${
                          item.type === 'income' ? 'text-[#16a34a]' : 'text-[#dc2626]'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'}
                        {formatINR(item.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- PAGE: PENDING MONEY ----------------- */}
        {currentPage === 'pending' && (
          <div>
            <button
              type="button"
              onClick={() => setCurrentPage('home')}
              className="border-none py-2.5 px-4 rounded-[10px] mb-3.5 cursor-pointer bg-[#e5e7eb] hover:bg-[#d1d5db] text-sm font-bold text-[#374151]"
            >
              ← Back
            </button>

            {/* Add Pending Form */}
            <div className="bg-white rounded-[20px] p-5 mb-3.5 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#111827] mb-4">Add Pending Money</h2>

              <form onSubmit={handleAddPending}>
                <select
                  value={pendingType}
                  onChange={(e) => setPendingType(e.target.value as 'receive' | 'pay')}
                  className="w-full p-4 border border-[#e5e7eb] rounded-[12px] text-base mb-3 bg-white outline-none focus:border-[#111827]"
                >
                  <option value="receive">Money To Receive</option>
                  <option value="pay">Money To Pay</option>
                </select>

                <input
                  type="number"
                  inputMode="decimal"
                  value={pendingAmount}
                  onChange={(e) => setPendingAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full p-4 border border-[#e5e7eb] rounded-[12px] text-base mb-3 bg-white outline-none focus:border-[#111827]"
                />

                <input
                  type="text"
                  value={pendingDescription}
                  onChange={(e) => setPendingDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full p-4 border border-[#e5e7eb] rounded-[12px] text-base mb-3 bg-white outline-none focus:border-[#111827]"
                />

                <button
                  type="submit"
                  className="w-full p-4 rounded-[13px] bg-[#111827] hover:bg-[#1f2937] text-white font-bold text-base transition cursor-pointer mt-1"
                >
                  ADD PENDING MONEY
                </button>
              </form>
            </div>

            {/* Pending List */}
            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#111827] mb-4">Pending Money</h2>

              {pendingItems.length === 0 ? (
                <div className="p-6 text-center text-[#6b7280] text-sm">
                  No pending money.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#f8fafc] rounded-[14px] p-4 border border-gray-100"
                    >
                      <h3 className="text-base font-bold text-[#111827]">{item.description}</h3>
                      <p className="mt-1.5 text-[#6b7280] text-[13px] font-medium">
                        {item.type === 'receive' ? 'To Receive: ' : 'To Pay: '}
                        <strong
                          className={
                            item.type === 'receive' ? 'text-[#16a34a]' : 'text-[#dc2626]'
                          }
                        >
                          {formatINR(item.amount)}
                        </strong>
                      </p>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCompletePending(item)}
                          className={`py-2 px-3 rounded-[8px] text-xs font-bold cursor-pointer transition ${
                            item.type === 'receive'
                              ? 'bg-[#dcfce7] text-[#166534] hover:bg-[#bbf7d0]'
                              : 'bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]'
                          }`}
                        >
                          {item.type === 'receive' ? 'Mark Received' : 'Mark Paid'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePending(item.id)}
                          className="py-2 px-3 rounded-[8px] bg-[#e5e7eb] hover:bg-[#d1d5db] text-[#374151] text-xs font-bold cursor-pointer transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- PAGE: SMART NOTES ----------------- */}
        {currentPage === 'notes' && (
          <div>
            <button
              type="button"
              onClick={() => setCurrentPage('home')}
              className="border-none py-2.5 px-4 rounded-[10px] mb-3.5 cursor-pointer bg-[#e5e7eb] hover:bg-[#d1d5db] text-sm font-bold text-[#374151]"
            >
              ← Back
            </button>

            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#111827] mb-1.5">
                📝 Smart Money Notes
              </h2>
              <p className="text-[#6b7280] mb-4 text-[13px] leading-relaxed">
                Write anything about money coming, money going, home money or future plans.
              </p>

              <textarea
                rows={8}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Example:&#10;₹2000 should come from home.&#10;₹500 should be paid to someone.&#10;Customer payment is pending."
                className="w-full p-4 border border-[#e5e7eb] rounded-[12px] text-base mb-3 bg-white outline-none focus:border-[#111827] resize-y min-h-[160px]"
              />

              {notesFeedback && (
                <div className="mb-3 p-3 rounded-[10px] bg-green-50 text-green-700 text-xs font-semibold">
                  {notesFeedback}
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveNotes}
                className="w-full p-4 rounded-[13px] bg-[#111827] hover:bg-[#1f2937] text-white font-bold text-base transition cursor-pointer"
              >
                SAVE NOTES
              </button>
            </div>
          </div>
        )}

        {/* ----------------- PAGE: MUSTANG ----------------- */}
        {currentPage === 'mustang' && (
          <div>
            <button
              type="button"
              onClick={() => setCurrentPage('home')}
              className="border-none py-2.5 px-4 rounded-[10px] mb-3.5 cursor-pointer bg-[#e5e7eb] hover:bg-[#d1d5db] text-sm font-bold text-[#374151]"
            >
              ← Back
            </button>

            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#111827] mb-3">🐎 Mustang</h2>
              <p className="text-[#6b7280] leading-[1.7] text-sm">
                This is your special section. You can later use it for premium features,
                goals, business tracking or anything you want to add.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
