import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Lock, Mail, User, Gift, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccessMsg('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(usernameOrEmail, password);
        onClose();
      } else {
        const msg = await register(username, email, password);
        setSuccessMsg(msg || 'Registration successful!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0a0a0a] p-5 sm:p-6 shadow-2xl border border-zinc-800 text-white transition-colors">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Modal Header & Tabs */}
        <div className="mb-4">
          <h2 className="text-lg font-bold font-['Syne',sans-serif] text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Free Account'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {mode === 'login'
              ? 'Access your purchased digital products and wallet balance'
              : 'Sign up to receive ৳50 welcome balance and instant product access'}
          </p>

          <div className="flex items-center gap-1 p-0.5 mt-3 bg-zinc-950 border border-zinc-850 rounded-lg">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign Up (+৳50 Gift)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 p-2 text-xs text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800/40">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 flex items-center gap-2 p-2 text-xs text-emerald-300 bg-emerald-950/40 rounded-lg border border-emerald-800/40">
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'login' ? (
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  Choose Username
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. shadow99"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

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
                    placeholder="you@gmail.com"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-zinc-300">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => alert('To reset password, please reach out to admin or open support desk ticket.')}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-xs"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In to Account' : 'Create Account & Claim ৳50'}
          </button>
        </form>

        <div className="mt-3.5 pt-2.5 border-t border-zinc-900 text-center text-[10px] text-zinc-500">
          Hashed passwords & encrypted user sessions guaranteed.
        </div>
      </div>
    </div>
  );
};
