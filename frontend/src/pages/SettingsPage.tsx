import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, Moon, Shield, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [currency, setCurrency] = useState<string>(user?.settings?.currency_code || 'INR');
  const [theme, setTheme] = useState<string>(user?.settings?.theme || 'dark');
  const [readingDay, setReadingDay] = useState<number>(user?.settings?.official_reading_day || 3);
  const [saved, setSaved] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/me');
      logout();
    } catch (err) {
      console.error('Failed to delete account', err);
      alert('Failed to delete account.');
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/settings?currency_code=${currency}&theme=${theme}&official_reading_day=${readingDay}`);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure multi-currency preferences, themes, and profile options.</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        {saved && (
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold">
            Settings updated successfully!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Preferred Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
            >
              <option value="INR">₹ INR – Indian Rupee</option>
              <option value="USD">$ USD – US Dollar</option>
              <option value="EUR">€ EUR – Euro</option>
              <option value="GBP">£ GBP – British Pound</option>
              <option value="JPY">¥ JPY – Japanese Yen</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">UI Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
            >
              <option value="dark">Dark Theme (Default)</option>
              <option value="light">Light Theme</option>
              <option value="system">System Preference</option>
            </select>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-bold text-slate-200 mb-3 border-b border-slate-800 pb-2">Billing & Meter Reading</h3>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Official Meter Reading Day (1-28)</label>
            <input
              type="number"
              min="1"
              max="28"
              value={readingDay}
              onChange={(e) => setReadingDay(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">This day determines when your monthly billing cycle resets.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
        >
          <Save size={18} />
          <span>Save Preferences</span>
        </button>
      </div>

      <div className="glass-card p-6 space-y-6 mt-6 border border-rose-500/20">
        <div>
          <h2 className="text-lg font-bold text-rose-500 flex items-center gap-2">
            <Trash2 size={18} /> Danger Zone
          </h2>
          <p className="text-slate-400 text-xs mt-1">Permanently delete your account and all associated data.</p>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-6 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/50 hover:bg-rose-500 hover:text-white text-rose-500 font-bold text-sm transition"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 text-center border border-rose-500/30">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center mb-2">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Account</h3>
            <p className="text-slate-400 text-sm">Are you sure you want to delete your account? All your meters, properties, readings, and bills will be permanently removed. This action cannot be undone.</p>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="w-1/2 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
