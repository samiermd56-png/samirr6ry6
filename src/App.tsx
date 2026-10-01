import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { UserDashboard } from './views/UserDashboard.tsx';
import { AdminPanel } from './views/AdminPanel.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { DepositModal } from './components/DepositModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { TelegramSimulatorModal } from './components/TelegramSimulatorModal.tsx';
import { Product, SiteSettings } from './types/index.ts';
import { api } from './services/api.ts';
import { ShoppingBag, Wallet, Gift, Headphones, Shield, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe?: any;
      };
    };
  }
}

function MainApp() {
  const { user } = useAuth();

  // Navigation & View State
  const [isAdminPath, setIsAdminPath] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  // Modals state
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login',
  });
  const [depositOpen, setDepositOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [telegramPreviewOpen, setTelegramPreviewOpen] = useState(false);

  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'DigiVault',
    siteLogo: '🛡️',
    currencySymbol: '৳',
    contactEmail: 'support@digivault.io',
    telegramChannel: 'https://t.me/DigiVaultStore',
    telegramBotUser: '@DigiVaultShopBot',
    noticeMarquee: '⚡ Instant Digital Delivery · 100% Guaranteed Replacements · bKash / Nagad Accepted',
    minDeposit: 100,
    maxDeposit: 25000,
    defaultAdminPasswordChanged: false,
  });

  const loadSettings = () => {
    api.getSiteSettings()
      .then(res => {
        if (res.success && res.settings) {
          setSiteSettings(res.settings);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadSettings();

    // Check if Telegram WebApp is active
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {
        // Ignore if sandbox limits
      }
    }

    // Inspect URL path for /admin security rule
    const checkPath = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.startsWith('/admin') || hash === '#admin') {
        setIsAdminPath(true);
      } else {
        setIsAdminPath(false);
      }

      // Check hash tabs
      if (hash === '#deposit') setActiveTab('deposit');
      if (hash === '#purchases') setActiveTab('purchases');
      if (hash === '#support') setActiveTab('support');
    };

    checkPath();
    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);
    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
    };
  }, []);

  const handleExitAdminToStore = () => {
    setIsAdminPath(false);
    window.history.pushState(null, '', '/');
  };

  // If user typed /admin or navigated to /admin -> Render Admin Gateway
  if (isAdminPath) {
    return (
      <AdminPanel
        onExitToStore={handleExitAdminToStore}
        siteSettings={siteSettings}
        onRefreshSettings={loadSettings}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Public Header - NO admin button visible */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
        onOpenDeposit={() => setDepositOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenTelegramPreview={() => setTelegramPreviewOpen(true)}
        siteName={siteSettings.siteName}
        siteLogo={siteSettings.siteLogo}
        currencySymbol={siteSettings.currencySymbol}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-6">
        <UserDashboard
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenDeposit={() => setDepositOpen(true)}
          onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
          onOpenProfile={() => setProfileOpen(true)}
          onSelectProduct={(p) => setSelectedProduct(p)}
          siteName={siteSettings.siteName}
          currencySymbol={siteSettings.currencySymbol}
        />
      </main>

      {/* Mobile Bottom Thumb Navigation Bar (Resized compact icons w-4 h-4) */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-1 text-[11px] font-medium transition-colors">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
            activeTab === 'store' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Store</span>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
            activeTab === 'purchases' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Purchases</span>
        </button>

        <button
          onClick={() => setDepositOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 text-emerald-600 dark:text-emerald-400 font-semibold"
        >
          <Wallet className="w-4 h-4" />
          <span>Deposit</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
            activeTab === 'support' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Support</span>
        </button>
      </nav>

      {/* Footer */}
      <Footer
        siteName={siteSettings.siteName}
        siteLogo={siteSettings.siteLogo}
        contactEmail={siteSettings.contactEmail}
        telegramChannel={siteSettings.telegramChannel}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
      />

      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        currencySymbol={siteSettings.currencySymbol}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        currencySymbol={siteSettings.currencySymbol}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        currencySymbol={siteSettings.currencySymbol}
        onPurchaseSuccess={() => {
          setActiveTab('purchases');
        }}
        onOpenDeposit={() => {
          setSelectedProduct(null);
          setDepositOpen(true);
        }}
        onOpenAuth={() => {
          setSelectedProduct(null);
          setAuthModal({ isOpen: true, mode: 'login' });
        }}
      />

      <TelegramSimulatorModal
        isOpen={telegramPreviewOpen}
        onClose={() => setTelegramPreviewOpen(false)}
        siteName={siteSettings.siteName}
        appUrl={window.location.origin}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
