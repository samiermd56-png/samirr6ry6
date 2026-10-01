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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-black/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-12 sm:h-13 max-w-7xl items-center justify-between px-3 sm:px-6">
        
        {/* Zone 1: Single compact text element wordmark */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('store')}
            className="flex items-center gap-1.5 text-left group focus:outline-none"
          >
            <span className="text-base sm:text-lg leading-none">{siteLogo}</span>
            <span className="font-['Syne',sans-serif] text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              {siteName}
            </span>
          </button>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-medium text-zinc-400">
          <button
            onClick={() => setActiveTab('store')}
            className={`transition-colors hover:text-white ${
              activeTab === 'store' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`transition-colors hover:text-white ${
              activeTab === 'purchases' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            Purchases
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`transition-colors hover:text-white ${
              activeTab === 'deposit' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            Add Funds
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`transition-colors hover:text-white ${
              activeTab === 'support' ? 'text-indigo-400 font-semibold' : ''
            }`}
          >
            Support
          </button>
        </nav>

        {/* Zone 3: Compact actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Telegram WebApp Preview Simulator Button */}
          <button
            onClick={onOpenTelegramPreview}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-sky-300 bg-sky-950/40 border border-sky-800/40 rounded-md hover:bg-sky-900/60 transition-colors whitespace-nowrap"
            title="Preview how users see the store inside Telegram Bot"
          >
            <Send className="w-3 h-3 text-sky-400" />
            <span className="hidden xs:inline sm:inline">Bot View</span>
          </button>

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Compact Wallet Balance Capsule */}
              <button
                onClick={onOpenDeposit}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] sm:text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 rounded-md hover:bg-emerald-900/60 transition-colors"
              >
                <Wallet className="w-3 h-3 text-emerald-400" />
                <span className="tabular-nums">{currencySymbol}{user.balance.toFixed(0)}</span>
                <PlusCircle className="w-2.5 h-2.5 text-emerald-400" />
              </button>

              {/* Profile Dropdown / Modal Trigger */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1 p-0.5 text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors text-xs font-medium"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-800 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate text-[11px]">{user.username}</span>
              </button>

              <button
                onClick={logout}
                className="p-1 text-zinc-400 hover:text-rose-400 rounded-md hover:bg-rose-950/40 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-2.5 py-1 text-[11px] sm:text-xs font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors whitespace-nowrap shadow-xs"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
