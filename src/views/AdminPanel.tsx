import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  User,
  Product,
  Deposit,
  PaymentGateway,
  PromoCode,
  Notice,
  SupportTicket,
  TelegramBot,
  SiteSettings,
} from '../types/index.ts';
import {
  Shield,
  LayoutDashboard,
  Users,
  DollarSign,
  Package,
  Send,
  Tag,
  Bell,
  Headphones,
  Settings,
  Database,
  Lock,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Key,
  Ban,
  Activity,
  LogOut,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface AdminPanelProps {
  onExitToStore: () => void;
  siteSettings: SiteSettings;
  onRefreshSettings: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onExitToStore,
  siteSettings,
  onRefreshSettings,
}) => {
  const { adminToken, isAdminLoggedIn, adminLogin, adminLogout } = useAuth();

  // Login form state
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Section
  const [activeSection, setActiveSection] = useState<
    | 'dashboard'
    | 'users'
    | 'deposits'
    | 'gateways'
    | 'products'
    | 'telegram'
    | 'promo'
    | 'notices'
    | 'tickets'
    | 'settings'
    | 'logs'
  >('dashboard');

  // Data states
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Feedback states
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals & sub-forms
  const [userSearch, setUserSearch] = useState('');
  const [balanceModal, setBalanceModal] = useState<{ user: User; amount: string; action: 'add' | 'deduct'; reason: string } | null>(null);
  const [passwordResetModal, setPasswordResetModal] = useState<{ user: User; newPass: string } | null>(null);

  // Product modal
  const [productForm, setProductForm] = useState<Partial<Product> | null>(null);

  // Gateway form
  const [gatewayForm, setGatewayForm] = useState<Partial<PaymentGateway> | null>(null);

  // Telegram bot form (max 5 limit)
  const [newBotName, setNewBotName] = useState('');
  const [newBotToken, setNewBotToken] = useState('');
  const [newBotChatId, setNewBotChatId] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Promo code form
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoValue, setNewPromoValue] = useState('50');
  const [newPromoMaxUses, setNewPromoMaxUses] = useState('100');

  // Notice form
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeType, setNewNoticeType] = useState<'info' | 'warning' | 'announcement'>('info');

  // Ticket reply
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Site Settings Form
  const [settingsForm, setSettingsForm] = useState({
    siteName: siteSettings.siteName,
    siteLogo: siteSettings.siteLogo,
    currencySymbol: siteSettings.currencySymbol,
    contactEmail: siteSettings.contactEmail,
    telegramChannel: siteSettings.telegramChannel,
    noticeMarquee: siteSettings.noticeMarquee,
    newAdminPassword: '',
  });

  const loadAllAdminData = useCallback(async () => {
    if (!isAdminLoggedIn) return;
    try {
      api.getAdminOverview().then(res => res.success && setAnalytics(res.analytics)).catch(console.error);
      api.getAdminUsers().then(res => res.success && setUsers(res.users)).catch(console.error);
      api.getAdminDeposits().then(res => res.success && setDeposits(res.deposits)).catch(console.error);
      api.getAdminGateways().then(res => res.success && setGateways(res.gateways)).catch(console.error);
      api.getProducts().then(res => res.success && setProducts(res.products)).catch(console.error);
      api.getTelegramBots().then(res => res.success && setBots(res.bots)).catch(console.error);
      api.getAdminPromoCodes().then(res => res.success && setPromoCodes(res.promoCodes)).catch(console.error);
      api.getAdminNotices().then(res => res.success && setNotices(res.notices)).catch(console.error);
      api.getAdminTickets().then(res => res.success && setTickets(res.tickets)).catch(console.error);
      api.getAdminLogs().then(res => res.success && setLogs(res.logs)).catch(console.error);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  }, [isAdminLoggedIn]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAllAdminData();
    }
  }, [isAdminLoggedIn, loadAllAdminData]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await adminLogin(adminPasswordInput);
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect password');
    } finally {
      setLoginLoading(false);
    }
  };

  const showToast = (success?: string, error?: string) => {
    if (success) {
      setActionSuccess(success);
      setTimeout(() => setActionSuccess(''), 3000);
    }
    if (error) {
      setActionError(error);
      setTimeout(() => setActionError(''), 3500);
    }
  };

  // Deposit Actions
  const handleApproveDeposit = async (id: string) => {
    try {
      const res = await api.updateDepositStatus(id, 'approved', 'Verified and Approved by Admin');
      if (res.success) {
        showToast('Deposit approved! User wallet has been automatically credited.');
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    const reason = prompt('Enter rejection reason (optional):', 'Invalid TrxID or payment not received');
    try {
      const res = await api.updateDepositStatus(id, 'rejected', reason || 'Rejected');
      if (res.success) {
        showToast('Deposit marked as rejected.');
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  // User Actions
  const handleBalanceUpdate = async () => {
    if (!balanceModal) return;
    try {
      const res = await api.updateUserBalance(
        balanceModal.user.id,
        parseFloat(balanceModal.amount),
        balanceModal.action,
        balanceModal.reason
      );
      if (res.success) {
        showToast(res.message);
        setBalanceModal(null);
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  const handleToggleBan = async (userId: string) => {
    try {
      const res = await api.toggleUserBan(userId);
      if (res.success) {
        showToast(res.message);
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordResetModal || !passwordResetModal.newPass) return;
    try {
      const res = await api.resetUserPassword(passwordResetModal.user.id, passwordResetModal.newPass);
      if (res.success) {
        showToast(res.message);
        setPasswordResetModal(null);
      }
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  // Telegram Actions
  const handleAddTelegramBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bots.length >= 5) {
      showToast(undefined, 'Maximum limit of 5 active bots reached! Please delete an existing bot first.');
      return;
    }

    setTelegramLoading(true);
    try {
      const res = await api.createTelegramBot(newBotName, newBotToken, newBotChatId);
      if (res.success) {
        showToast(res.message);
        setNewBotName('');
        setNewBotToken('');
        setNewBotChatId('');
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(undefined, err.message);
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleTestBot = async (botId: string) => {
    try {
      const res = await api.testTelegramBot(botId);
      if (res.success) {
        showToast(res.message);
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to permanently delete this bot and clear its webhooks?')) return;
    try {
      const res = await api.deleteTelegramBot(botId);
      if (res.success) {
        showToast(res.message);
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  // Product Actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm) return;
    try {
      if (productForm.id) {
        const res = await api.updateProduct(productForm.id, productForm);
        showToast(res.message);
      } else {
        const res = await api.createProduct(productForm);
        showToast(res.message);
      }
      setProductForm(null);
      loadAllAdminData();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product permanently?')) return;
    try {
      const res = await api.deleteProduct(id);
      showToast(res.message);
      loadAllAdminData();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  // Gateway Actions
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayForm) return;
    try {
      if (gatewayForm.id) {
        const res = await api.updateGateway(gatewayForm.id, gatewayForm);
        showToast(res.message);
      } else {
        const res = await api.createGateway(gatewayForm);
        showToast(res.message);
      }
      setGatewayForm(null);
      loadAllAdminData();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  const handleDeleteGateway = async (id: string) => {
    if (!confirm('Delete this gateway?')) return;
    try {
      const res = await api.deleteGateway(id);
      showToast(res.message);
      loadAllAdminData();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  // Promo Code Actions
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createPromoCode({
        code: newPromoCode,
        value: parseFloat(newPromoValue),
        maxUses: parseInt(newPromoMaxUses, 10),
      });
      showToast(res.message);
      setNewPromoCode('');
      loadAllAdminData();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      const res = await api.deletePromoCode(id);
      showToast(res.message);
      loadAllAdminData();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  // Notice Actions
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createNotice(newNoticeTitle, newNoticeContent, newNoticeType);
      showToast(res.message);
      setNewNoticeTitle('');
      setNewNoticeContent('');
      loadAllAdminData();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      const res = await api.deleteNotice(id);
      showToast(res.message);
      loadAllAdminData();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  // Support Reply Action
  const handleSendTicketReply = async (id: string) => {
    if (!ticketReplyText.trim()) return;
    try {
      const res = await api.replyTicket(id, ticketReplyText, 'answered');
      showToast(res.message);
      setReplyTicketId(null);
      setTicketReplyText('');
      loadAllAdminData();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateSiteSettings(settingsForm);
      showToast(res.message);
      setSettingsForm(prev => ({ ...prev, newAdminPassword: '' }));
      onRefreshSettings();
    } catch (err: any) {
      showToast(undefined, err.message);
    }
  };

  // IF NOT LOGGED IN AS ADMIN -> Show Secure Admin Login Portal
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#0a0a0a] border border-zinc-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-['Syne',sans-serif] tracking-tight text-white">
              Administrator Access
            </h1>
            <p className="text-xs text-slate-400">
              Restricted Area. Default password is <code className="text-indigo-400 font-mono font-semibold">1234</code>
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl text-xs bg-rose-950/50 text-rose-300 border border-rose-800/60 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={e => setAdminPasswordInput(e.target.value)}
                  placeholder="Enter admin password (1234)"
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loginLoading ? 'Verifying...' : 'Unlock Admin Command Center'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <button
              onClick={onExitToStore}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Return to Public Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN ADMIN CONSOLE
  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col md:flex-row font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Toast Feedback */}
      {actionSuccess && (
        <div className="fixed bottom-4 right-4 z-50 p-3 px-4 rounded-xl bg-emerald-600 text-white text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 p-3 px-4 rounded-xl bg-rose-600 text-white text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Brand & Exit */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-base">{siteSettings.siteLogo}</span>
              <div>
                <span className="font-['Syne',sans-serif] text-sm font-bold tracking-tight text-white block">
                  {siteSettings.siteName}
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">ADMIN VAULT</span>
              </div>
            </div>
            <button
              onClick={onExitToStore}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Return to Public Store"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Live Analytics</span>
            </button>

            <button
              onClick={() => setActiveSection('deposits')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'deposits' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Deposit Approvals</span>
              </div>
              {deposits.filter(d => d.status === 'pending').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                  {deposits.filter(d => d.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Management</span>
            </button>

            <button
              onClick={() => setActiveSection('products')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'products' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Digital Products</span>
            </button>

            <button
              onClick={() => setActiveSection('telegram')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'telegram' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-3.5 h-3.5" />
                <span>Telegram Bot (Max 5)</span>
              </div>
              <span className="text-[10px] text-sky-400 font-mono">
                {bots.length}/5
              </span>
            </button>

            <button
              onClick={() => setActiveSection('gateways')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'gateways' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Payment Gateways</span>
            </button>

            <button
              onClick={() => setActiveSection('promo')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'promo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Promo Codes</span>
            </button>

            <button
              onClick={() => setActiveSection('notices')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'notices' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notice Board</span>
            </button>

            <button
              onClick={() => setActiveSection('tickets')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'tickets' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Headphones className="w-3.5 h-3.5" />
                <span>Support Desk</span>
              </div>
              {tickets.filter(t => t.status === 'open').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500 text-white font-bold">
                  {tickets.filter(t => t.status === 'open').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Site & Password</span>
            </button>

            <button
              onClick={() => setActiveSection('logs')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors font-medium ${
                activeSection === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>
          </nav>
        </div>

        {/* Admin Logout */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={adminLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin Console</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
        
        {/* ======================================================== */}
        {/* 1. ANALYTICS & PROFIT CALCULATOR */}
        {/* ======================================================== */}
        {activeSection === 'dashboard' && analytics && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
                  Analytics & Live Profit Calculator
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time sales revenue, wallet liability, and daily transaction metrics
                </p>
              </div>
              <button
                onClick={loadAllAdminData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Total Gross Revenue</span>
                <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  ৳{analytics.totalRevenue}
                </p>
                <span className="text-[11px] text-slate-500">From completed orders</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Live Estimated Profit</span>
                <p className="text-2xl font-bold font-mono text-indigo-400 tabular-nums">
                  ৳{analytics.estimatedProfit}
                </p>
                <span className="text-[11px] text-slate-500">100% digital goods margin</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Deposits Verified</span>
                <p className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
                  ৳{analytics.totalDepositsApproved}
                </p>
                <span className="text-[11px] text-slate-500">bKash / Nagad / Rocket</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Registered Users</span>
                <p className="text-2xl font-bold font-mono text-white tabular-nums">
                  {analytics.totalUsers}
                </p>
                <span className="text-[11px] text-slate-500">{analytics.totalSalesCount} total sales</span>
              </div>
            </div>

            {/* Daily Trend Table */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Daily Sales & Deposits (Past 7 Days)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Date</th>
                      <th className="py-2.5 px-4 font-semibold">Orders Revenue</th>
                      <th className="py-2.5 px-4 font-semibold">Approved Deposits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {analytics.dailyReports.map((row: any) => (
                      <tr key={row.date} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono text-slate-300">{row.date}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-400 tabular-nums">
                          ৳{row.sales}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-sky-400 tabular-nums">
                          ৳{row.deposits}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. DEPOSIT APPROVAL PANEL */}
        {/* ======================================================== */}
        {activeSection === 'deposits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
                  Deposit Request Verification Desk
                </h2>
                <p className="text-xs text-slate-400">
                  Approve or reject manual bKash, Nagad, and Rocket deposits. Approving automatically credits the user&apos;s wallet balance!
                </p>
              </div>
              <button
                onClick={loadAllAdminData}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Method</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Sender Phone</th>
                    <th className="py-3 px-4 font-semibold">TrxID</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {deposits.map(dep => (
                    <tr key={dep.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{dep.username}</td>
                      <td className="py-3 px-4 uppercase font-semibold text-indigo-400">{dep.method}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 tabular-nums">৳{dep.amount}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{dep.senderNumber}</td>
                      <td className="py-3 px-4 font-mono font-medium text-amber-300 select-all">{dep.trxId}</td>
                      <td className="py-3 px-4 text-slate-400 tabular-nums">
                        {new Date(dep.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            dep.status === 'approved'
                              ? 'bg-emerald-950 text-emerald-400'
                              : dep.status === 'rejected'
                              ? 'bg-rose-950 text-rose-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {dep.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {dep.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveDeposit(dep.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-500 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(dep.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 bg-rose-950/80 border border-rose-800 rounded hover:bg-rose-900 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">{dep.adminNote || 'Processed'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. USER MANAGEMENT */}
        {/* ======================================================== */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
                  User Accounts ({users.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Search users, adjust balances manually, ban/unban accounts, or reset credentials
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by username or email..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Balance</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users
                    .filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                    .map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                          <span>{u.username}</span>
                          {u.role === 'admin' && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1 rounded">ADMIN</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{u.email}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 tabular-nums">
                          ৳{u.balance.toFixed(0)}
                        </td>
                        <td className="py-3 px-4 uppercase text-[11px] text-slate-400">{u.role}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.isBanned ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'
                            }`}
                          >
                            {u.isBanned ? 'BANNED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setBalanceModal({ user: u, amount: '100', action: 'add', reason: 'Admin adjustment' })}
                              className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded"
                              title="Add or Deduct Balance"
                            >
                              Balance ±
                            </button>
                            <button
                              onClick={() => setPasswordResetModal({ user: u, newPass: 'newpass123' })}
                              className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 rounded"
                              title="Reset Password"
                            >
                              <Key className="w-3 h-3" />
                            </button>
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleBan(u.id)}
                                className={`px-2 py-1 text-[11px] rounded ${
                                  u.isBanned
                                    ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400'
                                    : 'bg-rose-950 hover:bg-rose-900 text-rose-400'
                                }`}
                              >
                                {u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Balance Modal */}
            {balanceModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    Adjust Balance: {balanceModal.user.username}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBalanceModal({ ...balanceModal, action: 'add' })}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                          balanceModal.action === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        + Add Balance
                      </button>
                      <button
                        type="button"
                        onClick={() => setBalanceModal({ ...balanceModal, action: 'deduct' })}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                          balanceModal.action === 'deduct' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        - Deduct Balance
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Amount (৳)</label>
                      <input
                        type="number"
                        value={balanceModal.amount}
                        onChange={e => setBalanceModal({ ...balanceModal, amount: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Reason</label>
                      <input
                        type="text"
                        value={balanceModal.reason}
                        onChange={e => setBalanceModal({ ...balanceModal, reason: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setBalanceModal(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBalanceUpdate}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-500"
                    >
                      Apply Adjustment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password Reset Modal */}
            {passwordResetModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    Reset Password for {passwordResetModal.user.username}
                  </h3>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">New Password</label>
                    <input
                      type="text"
                      value={passwordResetModal.newPass}
                      onChange={e => setPasswordResetModal({ ...passwordResetModal, newPass: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setPasswordResetModal(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetPassword}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-500"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. TELEGRAM BOT AUTOMATION (Max 5 limit & Deletion) */}
        {/* ======================================================== */}
        {activeSection === 'telegram' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
                Telegram Bot Automation & WebApp Launcher
              </h2>
              <p className="text-xs text-slate-400">
                Configure up to <strong>5 active bots</strong>. When users open the bot, the website content is seamlessly displayed inside Telegram WebApp! Instant alerts for registration, deposits, and orders are sent to your Chat ID.
              </p>
            </div>

            {/* Bot Limit Warning if reached */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span>Active Telegram Bots: <strong className="text-sky-400 font-mono">{bots.length} / 5 Maximum</strong></span>
              {bots.length >= 5 && (
                <span className="text-amber-400 font-semibold">Limit reached. Delete a bot to add another.</span>
              )}
            </div>

            {/* Add Bot Form (Disabled if >= 5) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-sky-400" />
                <span>Add & Configure Telegram Bot</span>
              </h3>

              <form onSubmit={handleAddTelegramBot} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Bot Label / Name
                    </label>
                    <input
                      type="text"
                      required
                      disabled={bots.length >= 5}
                      value={newBotName}
                      onChange={e => setNewBotName(e.target.value)}
                      placeholder="e.g. DigiVault Official Bot"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Telegram Bot Token
                    </label>
                    <input
                      type="text"
                      required
                      disabled={bots.length >= 5}
                      value={newBotToken}
                      onChange={e => setNewBotToken(e.target.value)}
                      placeholder="e.g. 7123456789:AAH..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Admin Chat ID (for Alerts)
                    </label>
                    <input
                      type="text"
                      required
                      disabled={bots.length >= 5}
                      value={newBotChatId}
                      onChange={e => setNewBotChatId(e.target.value)}
                      placeholder="e.g. 123456789 or @channel"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-slate-500">
                    Get your bot token from <code className="text-sky-400">@BotFather</code> and your Chat ID from <code className="text-sky-400">@userinfobot</code>.
                  </p>
                  <button
                    type="submit"
                    disabled={telegramLoading || bots.length >= 5}
                    className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {telegramLoading ? 'Connecting...' : 'Save & Activate Bot'}
                  </button>
                </div>
              </form>
            </div>

            {/* List of Configured Bots */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Configured Bots ({bots.length}/5)</h3>

              {bots.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-xs">
                  No Telegram bots added yet. Add your bot token above to enable instant alerts and WebApp store access.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bots.map(bot => (
                    <div
                      key={bot.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{bot.name}</h4>
                          <span className="text-xs text-sky-400 font-mono">@{bot.botUsername || 'Bot'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400">
                          ACTIVE
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1 font-mono">
                        <div>Chat ID: <span className="text-slate-200">{bot.chatId}</span></div>
                        <div className="truncate">Token: <span className="text-slate-500">{bot.botToken.slice(0, 10)}...</span></div>
                        {bot.lastTestStatus && (
                          <div className="text-[11px] text-slate-400 font-sans">
                            Last Status: {bot.lastTestStatus}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleTestBot(bot.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800 rounded hover:bg-sky-900 transition-colors"
                        >
                          🧪 Test Bot
                        </button>
                        <button
                          onClick={() => handleDeleteBot(bot.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                        >
                          Delete Bot
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. PRODUCT MANAGEMENT */}
        {/* ======================================================== */}
        {activeSection === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
                  Digital Product Catalog & Stock ({products.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Manage digital products, validity duration in days, secret download links, and passwords
                </p>
              </div>
              <button
                onClick={() => setProductForm({
                  name: '',
                  category: 'Software',
                  price: 500,
                  validityDays: 365,
                  description: '',
                  fileDownloadUrl: '',
                  secretPassword: '',
                  stock: 50,
                  imageUrl: '/src/assets/images/product_vpn_suite_1790839132343.jpg',
                })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="aspect-16/9 w-full rounded-xl overflow-hidden bg-slate-950">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{p.category}</span>
                      <span className="font-mono text-emerald-400 font-bold">৳{p.price}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Validity: {p.validityDays} Days</span>
                      <span>Stock: {p.stock > 0 ? p.stock : 'Unlimited'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setProductForm(p)}
                      className="px-2.5 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-950/40 rounded transition-colors"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Product Edit/Create Modal */}
            {productForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
                <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-base font-bold text-white">
                    {productForm.id ? 'Edit Product' : 'Create New Digital Product'}
                  </h3>

                  <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Product Name</label>
                      <input
                        type="text"
                        required
                        value={productForm.name || ''}
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Category</label>
                        <input
                          type="text"
                          required
                          value={productForm.category || ''}
                          onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Price (৳)</label>
                        <input
                          type="number"
                          required
                          value={productForm.price || ''}
                          onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Validity (Days)</label>
                        <input
                          type="number"
                          required
                          value={productForm.validityDays || 365}
                          onChange={e => setProductForm({ ...productForm, validityDays: parseInt(e.target.value, 10) })}
                          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Stock (-1 for unlimited)</label>
                        <input
                          type="number"
                          required
                          value={productForm.stock !== undefined ? productForm.stock : 50}
                          onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value, 10) })}
                          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Secret File Download URL</label>
                      <input
                        type="url"
                        value={productForm.fileDownloadUrl || ''}
                        onChange={e => setProductForm({ ...productForm, fileDownloadUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Secret License Password / Key</label>
                      <input
                        type="text"
                        value={productForm.secretPassword || ''}
                        onChange={e => setProductForm({ ...productForm, secretPassword: e.target.value })}
                        placeholder="Password or serial key"
                        className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Image URL</label>
                      <input
                        type="text"
                        value={productForm.imageUrl || ''}
                        onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                        className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={productForm.description || ''}
                        onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setProductForm(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-500"
                      >
                        Save Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. PAYMENT GATEWAYS */}
        {/* ======================================================== */}
        {activeSection === 'gateways' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
                  Payment Gateways (bKash / Nagad / Rocket)
                </h2>
                <p className="text-xs text-slate-400">
                  Manage deposit phone numbers, account types, and min/max limits
                </p>
              </div>
              <button
                onClick={() => setGatewayForm({
                  method: 'bkash',
                  number: '',
                  type: 'Personal',
                  instructions: 'Send money and submit TrxID.',
                  minDeposit: 100,
                  maxDeposit: 25000,
                  isActive: true,
                })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Gateway</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gateways.map(g => (
                <div key={g.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm uppercase text-white">{g.method}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${g.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {g.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="font-mono text-sm text-indigo-300 font-bold">{g.number}</div>
                  <div className="text-xs text-slate-400">Type: {g.type}</div>
                  <div className="text-[11px] text-slate-500">Min: ৳{g.minDeposit} · Max: ৳{g.maxDeposit}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setGatewayForm(g)}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGateway(g.id)}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {gatewayForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white">Payment Gateway</h3>
                  <form onSubmit={handleSaveGateway} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Method</label>
                      <select
                        value={gatewayForm.method}
                        onChange={e => setGatewayForm({ ...gatewayForm, method: e.target.value as any })}
                        className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                      >
                        <option value="bkash">bKash</option>
                        <option value="nagad">Nagad</option>
                        <option value="rocket">Rocket</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Account Phone Number</label>
                      <input
                        type="text"
                        required
                        value={gatewayForm.number || ''}
                        onChange={e => setGatewayForm({ ...gatewayForm, number: e.target.value })}
                        className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Account Type</label>
                      <input
                        type="text"
                        value={gatewayForm.type || 'Personal'}
                        onChange={e => setGatewayForm({ ...gatewayForm, type: e.target.value as any })}
                        className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">Min Deposit</label>
                        <input
                          type="number"
                          value={gatewayForm.minDeposit || 100}
                          onChange={e => setGatewayForm({ ...gatewayForm, minDeposit: parseFloat(e.target.value) })}
                          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Max Deposit</label>
                        <input
                          type="number"
                          value={gatewayForm.maxDeposit || 25000}
                          onChange={e => setGatewayForm({ ...gatewayForm, maxDeposit: parseFloat(e.target.value) })}
                          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setGatewayForm(null)}
                        className="px-3 py-1.5 text-xs text-slate-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. PROMO CODES */}
        {/* ======================================================== */}
        {activeSection === 'promo' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
              Promo Codes & Balance Vouchers
            </h2>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Create New Promo Code</h3>
              <form onSubmit={handleCreatePromo} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={newPromoCode}
                    onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VIP200"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Reward Value (৳)</label>
                  <input
                    type="number"
                    required
                    value={newPromoValue}
                    onChange={e => setNewPromoValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Uses</label>
                  <input
                    type="number"
                    required
                    value={newPromoMaxUses}
                    onChange={e => setNewPromoMaxUses(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
                  >
                    Generate Promo Code
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Code</th>
                    <th className="py-3 px-4 font-semibold">Reward</th>
                    <th className="py-3 px-4 font-semibold">Used / Max</th>
                    <th className="py-3 px-4 font-semibold">Expires</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {promoCodes.map(p => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{p.code}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">৳{p.value}</td>
                      <td className="py-3 px-4 tabular-nums">{p.usedCount} / {p.maxUses}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(p.expiresAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeletePromo(p.id)}
                          className="text-xs text-rose-400 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 8. NOTICES */}
        {/* ======================================================== */}
        {activeSection === 'notices' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
              Global Notice Board Management
            </h2>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Post Announcement Banner</h3>
              <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={newNoticeTitle}
                      onChange={e => setNewNoticeTitle(e.target.value)}
                      placeholder="e.g. Flash Discount or System Maintenance"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Type</label>
                    <select
                      value={newNoticeType}
                      onChange={e => setNewNoticeType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    >
                      <option value="info">Info</option>
                      <option value="announcement">Announcement</option>
                      <option value="warning">Warning</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Message Content</label>
                  <textarea
                    rows={2}
                    required
                    value={newNoticeContent}
                    onChange={e => setNewNoticeContent(e.target.value)}
                    placeholder="Details visible to all customers..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
                >
                  Publish Notice
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {notices.map(n => (
                <div key={n.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{n.title}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400">
                        {n.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{n.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNotice(n.id)}
                    className="text-xs text-rose-400 hover:underline shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 9. SUPPORT DESK */}
        {/* ======================================================== */}
        {activeSection === 'tickets' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
              Customer Support Tickets ({tickets.length})
            </h2>

            <div className="space-y-3">
              {tickets.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm">{t.subject}</span>
                      <span className="text-slate-400 ml-2">from {t.username}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${t.status === 'open' ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'}`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-slate-300 whitespace-pre-line bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    {t.message}
                  </p>

                  {t.reply ? (
                    <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/50">
                      <span className="text-[11px] font-semibold text-indigo-300 block">Your Reply:</span>
                      <p className="text-indigo-200">{t.reply}</p>
                    </div>
                  ) : replyTicketId === t.id ? (
                    <div className="space-y-2 pt-2">
                      <textarea
                        rows={2}
                        value={ticketReplyText}
                        onChange={e => setTicketReplyText(e.target.value)}
                        placeholder="Write support answer..."
                        className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendTicketReply(t.id)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded"
                        >
                          Send Answer
                        </button>
                        <button
                          onClick={() => setReplyTicketId(null)}
                          className="px-3 py-1 text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReplyTicketId(t.id); setTicketReplyText(''); }}
                      className="px-2.5 py-1 text-xs bg-slate-800 text-indigo-300 rounded hover:bg-slate-700"
                    >
                      Reply to Ticket
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 10. SITE SETTINGS & DEFAULT ADMIN PASSWORD */}
        {/* ======================================================== */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
              Platform Branding & Admin Security
            </h2>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-2xl">
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Site Name</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.siteName}
                      onChange={e => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Site Logo Emoji or Icon</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.siteLogo}
                      onChange={e => setSettingsForm({ ...settingsForm, siteLogo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.currencySymbol}
                      onChange={e => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={settingsForm.contactEmail}
                      onChange={e => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Telegram Community Link</label>
                  <input
                    type="text"
                    value={settingsForm.telegramChannel}
                    onChange={e => setSettingsForm({ ...settingsForm, telegramChannel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-semibold">
                    Change Admin Password (currently default is 1234)
                  </label>
                  <input
                    type="password"
                    value={settingsForm.newAdminPassword}
                    onChange={e => setSettingsForm({ ...settingsForm, newAdminPassword: e.target.value })}
                    placeholder="Enter new admin password to update"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Leave blank if you do not want to change your password.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <a
                    href="/api/admin/backup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Download JSON Backup</span>
                  </a>

                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 11. AUDIT ACTIVITY LOGS */}
        {/* ======================================================== */}
        {activeSection === 'logs' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-['Syne',sans-serif] text-white">
              System & Security Audit Logs ({logs.length})
            </h2>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-4 font-semibold">Action</th>
                    <th className="py-2.5 px-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-indigo-400 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 font-sans text-xs">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
