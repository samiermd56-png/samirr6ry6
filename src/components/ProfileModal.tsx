import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { X, User, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currencySymbol,
}) => {
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.profileAvatar || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.updateProfile({
        email,
        profileAvatar: avatar,
        newPassword: newPassword || undefined,
      });

      if (res.success) {
        setSuccess('Profile updated successfully!');
        setNewPassword('');
        refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold font-['Syne',sans-serif] text-slate-900 dark:text-white">
              {user.username}
            </h2>
            <p className="text-xs text-slate-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
              <span>Balance: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{currencySymbol}{user.balance.toFixed(0)}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Spent: <strong className="tabular-nums">{currencySymbol}{user.totalSpent || 0}</strong></span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg border border-rose-200/50">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 p-2.5 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200/50">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        <form onSubmit={handleUpdate} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Change Password (leave blank to keep current)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (optional)"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Profile Avatar Image URL (optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="url"
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-xs"
          >
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
