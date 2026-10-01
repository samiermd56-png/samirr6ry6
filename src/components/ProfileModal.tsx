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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0a0a0a] p-4 sm:p-6 shadow-2xl border border-zinc-800 text-white transition-colors max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-900">
          <div className="w-10 h-10 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-sm shadow-sm border border-zinc-700">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold font-['Syne',sans-serif] text-white">
              {user.username}
            </h2>
            <p className="text-xs text-zinc-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
              <span>Balance: <strong className="text-emerald-400 tabular-nums">{currencySymbol}{user.balance.toFixed(0)}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Spent: <strong className="tabular-nums">{currencySymbol}{user.totalSpent || 0}</strong></span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 p-2 text-xs text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800/40">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-3 flex items-center gap-2 p-2 text-xs text-emerald-300 bg-emerald-950/40 rounded-lg border border-emerald-800/40">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        <form onSubmit={handleUpdate} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Change Password (leave blank to keep current)
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (optional)"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Profile Avatar Image URL (optional)
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="url"
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-xs"
          >
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
