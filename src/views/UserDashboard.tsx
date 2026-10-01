import React, { useState, useEffect } from 'react';
import { Product, Purchase, Deposit, Notice, SupportTicket } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Wallet,
  ShoppingBag,
  Search,
  Download,
  Key,
  Clock,
  CheckCircle,
  Copy,
  PlusCircle,
  ExternalLink,
  MessageSquare,
  Tag,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface UserDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenProfile: () => void;
  onSelectProduct: (product: Product) => void;
  siteName: string;
  currencySymbol: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  activeTab,
  setActiveTab,
  onOpenDeposit,
  onOpenAuth,
  onOpenProfile,
  onSelectProduct,
  siteName,
  currencySymbol,
}) => {
  const { user, refreshUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Promo code redemption state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Support ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Copy helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    // Fetch products and notices
    api.getProducts().then(res => res.success && setProducts(res.products)).catch(console.error);
    api.getNotices().then(res => res.success && setNotices(res.notices)).catch(console.error);

    if (user) {
      api.getPurchases().then(res => res.success && setPurchases(res.purchases)).catch(console.error);
      api.getLedger().then(res => {
        if (res.success) {
          setDeposits(res.deposits);
          if (res.purchases) setPurchases(res.purchases);
        }
      }).catch(console.error);
      api.getTickets().then(res => res.success && setTickets(res.tickets)).catch(console.error);
    }
  }, [user, activeTab]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (!promoCodeInput.trim()) return;

    setPromoLoading(true);
    setPromoStatus(null);
    try {
      const res = await api.redeemPromo(promoCodeInput.trim());
      if (res.success) {
        setPromoStatus({ type: 'success', message: res.message });
        setPromoCodeInput('');
        refreshUser();
      }
    } catch (err: any) {
      setPromoStatus({ type: 'error', message: err.message || 'Failed to redeem promo code' });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setTicketLoading(true);
    setTicketStatus(null);
    try {
      const res = await api.createTicket(ticketSubject.trim(), ticketMessage.trim());
      if (res.success) {
        setTicketStatus('Support ticket submitted! Our staff will reply soon.');
        setTicketSubject('');
        setTicketMessage('');
        api.getTickets().then(tRes => tRes.success && setTickets(tRes.tickets));
      }
    } catch (err: any) {
      setTicketStatus(`Error: ${err.message || 'Failed to submit ticket'}`);
    } finally {
      setTicketLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
      
      {/* 1. Global Live Notice Strip */}
      {notices.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200">
          <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="flex-1 overflow-hidden">
            <span className="font-semibold">{notices[0].title}:</span>{' '}
            <span className="text-indigo-800/80 dark:text-indigo-300/80">{notices[0].content}</span>
          </div>
        </div>
      )}

      {/* 2. Dynamic User Overview Stats Strip */}
      {user ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Wallet Balance Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">Current Wallet Balance</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {currencySymbol}{user.balance.toFixed(0)}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Ready for instant checkout
              </span>
            </div>
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Deposit</span>
            </button>
          </div>

          {/* Purchased Items Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">Purchased Items Vault</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {purchases.length}
              </p>
              <button
                onClick={() => setActiveTab('purchases')}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
              >
                <span>View unlocked credentials</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          {/* Support Desk Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">Customer Support Desk</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {tickets.length}
              </p>
              <button
                onClick={() => setActiveTab('support')}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
              >
                <span>Help tickets & status</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
        </div>
      ) : (
        /* Welcome Banner for Guest Visitors */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-indigo-200 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-indigo-300" />
              <span>Instant Digital Product Delivery & Telegram WebApp</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Syne',sans-serif] tracking-tight">
              Premium Digital Goods, Developer Tools & Accounts
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
              Instant access to verified VPN suites, boilerplate source code, course bundles, and premium passes. Claim ৳50 welcome bonus upon free registration.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
              >
                Create Account (+৳50 Gift)
              </button>
              <button
                onClick={() => setActiveTab('store')}
                className="px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Browse Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation (Store, Purchases, Deposit, Support) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('store')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'store'
              ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Product Catalog
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'purchases'
              ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>My Purchases</span>
          {purchases.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {purchases.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'deposit'
              ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Deposit Ledger & History
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'support'
              ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Support Desk
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PRODUCT CATALOG & STORE */}
      {/* ======================================================== */}
      {activeTab === 'store' && (
        <section className="space-y-6">
          {/* Controls: Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Category Segmented Controls */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products & tools..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Product Cards Grid: 3-column desktop, 2-column tablet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Lead with imagery */}
                  <div className="aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Clean unboxed metadata */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{product.validityDays} Days</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400">Instant Unlocked</span>
                    </div>

                    <h3 className="text-sm font-bold font-['Syne',sans-serif] text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {product.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Price and Instant Purchase Action */}
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Price</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">
                      {currencySymbol}{product.price}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectProduct(product)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-xs"
                  >
                    <span>View & Buy</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No products found matching &quot;{searchQuery}&quot;
            </div>
          )}

          {/* Promo Code Box */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Have a Promo Code or Voucher?</span>
              </div>
              <p className="text-xs text-slate-500">
                Redeem promo codes like <strong>WELCOME100</strong> for instant wallet credits.
              </p>
            </div>

            <form onSubmit={handleRedeemPromo} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={promoCodeInput}
                onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                className="px-3 py-1.5 text-xs font-mono uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={promoLoading}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {promoLoading ? '...' : 'Redeem'}
              </button>
            </form>
          </div>

          {promoStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                promoStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              {promoStatus.type === 'success' ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{promoStatus.message}</span>
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MY PURCHASES / SECURE ACCESS VAULT */}
      {/* ======================================================== */}
      {activeTab === 'purchases' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-['Syne',sans-serif] text-slate-900 dark:text-white">
                My Unlocked Digital Purchases
              </h2>
              <p className="text-xs text-slate-500">
                Download links, configuration archives, and secret license passwords
              </p>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              Total {purchases.length} Items Unlocked
            </span>
          </div>

          {!user ? (
            <div className="text-center py-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Please Sign In</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Sign in to view your purchased licenses and download keys.
              </p>
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign In Now
              </button>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Purchases Yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Browse our product catalog to buy software, accounts, or templates.
              </p>
              <button
                onClick={() => setActiveTab('store')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Explore Products Store
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active License</span>
                      <span aria-hidden="true">·</span>
                      <span>Order #{item.id.slice(-6).toUpperCase()}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.productName}
                    </h3>

                    {/* Secret Password Reveal Box */}
                    {item.secretPassword && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Key className="w-3 h-3 text-amber-500" /> License Key / Password:
                        </span>
                        <code className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {item.secretPassword}
                        </code>
                        <button
                          onClick={() => copyToClipboard(item.secretPassword || '', item.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Copy Password"
                        >
                          {copiedKey === item.id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400">
                      Purchased: {new Date(item.purchasedAt).toLocaleDateString()} · Expires: {new Date(item.expiresAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                    <a
                      href={item.fileDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DEPOSIT LEDGER & HISTORY */}
      {/* ======================================================== */}
      {activeTab === 'deposit' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-['Syne',sans-serif] text-slate-900 dark:text-white">
                Deposit History & Transaction Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Track all your manual bKash, Nagad, and Rocket wallet deposit requests
              </p>
            </div>
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Deposit</span>
            </button>
          </div>

          {!user ? (
            <div className="text-center py-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Sign In to View Deposits</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Access your deposit history and submitted Transaction IDs.
              </p>
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign In Now
              </button>
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Wallet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Deposits Recorded</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                You haven&apos;t submitted any deposit requests yet.
              </p>
              <button
                onClick={onOpenDeposit}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Funds via bKash / Nagad
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Method</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Sender Number</th>
                    <th className="py-3 px-4 font-semibold">Transaction ID (TrxID)</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {deposits.map(dep => (
                    <tr key={dep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold uppercase text-slate-900 dark:text-white">
                        {dep.method}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {currencySymbol}{dep.amount}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {dep.senderNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        {dep.trxId}
                      </td>
                      <td className="py-3 px-4 text-slate-400 tabular-nums">
                        {new Date(dep.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            dep.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : dep.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}
                        >
                          {dep.status === 'approved' && '✓ Approved'}
                          {dep.status === 'rejected' && '✕ Rejected'}
                          {dep.status === 'pending' && '⏳ Verifying'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SUPPORT DESK & TICKETS */}
      {/* ======================================================== */}
      {activeTab === 'support' && (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-['Syne',sans-serif] text-slate-900 dark:text-white">
              Support Desk & Help Center
            </h2>
            <p className="text-xs text-slate-500">
              Need assistance with product access, deposit questions, or custom requests? Submit a ticket below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Ticket Form */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Open New Support Ticket</span>
              </h3>

              {ticketStatus && (
                <div className="mb-4 p-2.5 rounded-lg text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                  {ticketStatus}
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    placeholder="e.g. Deposit confirmation or product file question"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Detailed Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={ticketMessage}
                    onChange={e => setTicketMessage(e.target.value)}
                    placeholder="Provide details about your query..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={ticketLoading}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {ticketLoading ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>

            {/* Ticket History */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Your Tickets ({tickets.length})
              </h3>

              {tickets.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs">
                  No support tickets found. We are here to help whenever you need!
                </div>
              ) : (
                tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{ticket.subject}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          ticket.status === 'answered'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50'
                            : ticket.status === 'closed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {ticket.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                      {ticket.message}
                    </p>

                    {ticket.reply && (
                      <div className="p-2.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 space-y-1">
                        <span className="font-semibold text-indigo-900 dark:text-indigo-200 block text-[11px]">
                          Staff Response:
                        </span>
                        <p className="text-indigo-800 dark:text-indigo-300">
                          {ticket.reply}
                        </p>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 pt-1">
                      Submitted on {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
