import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { Sun, Moon, Wallet, User as UserIcon, LogOut, PlusCircle, ShoppingBag, Send } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDeposit: () => void;
  onOpenProfile: () => void;
  onOpenTelegramPreview: () => void;
  siteName: string;
  siteLogo: string;
  currencySymbol: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenDeposit,
  onOpenProfile,
  onOpenTelegramPreview,
  siteName,
  siteLogo,
  currencySymbol,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('store')}
            className="flex items-center gap-2 text-left group focus:outline-none"
          >
            <span className="text-lg leading-none">{siteLogo}</span>
            <span className="font-['Syne',sans-serif] text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {siteName}
            </span>
          </button>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('store')}
            className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === 'store' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
            }`}
          >
            Products Store
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === 'purchases' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
            }`}
          >
            My Purchases
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === 'deposit' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
            }`}
          >
            Add Funds
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === 'support' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
            }`}
          >
            Support
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions + theme switch */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Telegram WebApp Preview Simulator Button */}
          <button
            onClick={onOpenTelegramPreview}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors whitespace-nowrap"
            title="Preview how users see the store inside Telegram Bot"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Telegram Bot</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {/* Wallet Balance Capsule */}
              <button
                onClick={onOpenDeposit}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="font-semibold tabular-nums">{currencySymbol}{user.balance.toFixed(0)}</span>
                <PlusCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </button>

              {/* Profile Dropdown / Modal Trigger */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs font-medium"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate">{user.username}</span>
              </button>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors whitespace-nowrap shadow-xs"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
