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
  MessageSquare,
  Tag,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  Lock,
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
  onOpenProfile: _onOpenProfile,
  onSelectProduct,
  siteName: _siteName,
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
    <div className="mx-auto max-w-7xl px-2.5 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* 1. Global Live Notice Strip */}
      {notices.length > 0 && (
        <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-[#0a0a0a] border border-zinc-800 text-[11px] sm:text-xs text-zinc-300">
          <Info className="w-3 h-3 text-indigo-400 shrink-0" />
          <div className="flex-1 overflow-hidden truncate">
            <span className="font-semibold text-white">{notices[0].title}:</span>{' '}
            <span className="text-zinc-400">{notices[0].content}</span>
          </div>
        </div>
      )}

      {/* 2. Dynamic User Overview Stats Strip - 3 columns side-by-side even on mobile */}
      {user ? (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {/* Wallet Balance Card */}
          <div className="p-2 sm:p-3 rounded-xl bg-[#0a0a0a] border border-zinc-850 shadow-xs flex flex-col justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-medium block truncate">Balance</span>
              <p className="text-xs sm:text-lg font-bold font-mono text-white tabular-nums">
                {currencySymbol}{user.balance.toFixed(0)}
              </p>
            </div>
            <button
              onClick={onOpenDeposit}
              className="mt-1.5 flex items-center justify-center gap-1 py-1 px-1.5 text-[10px] sm:text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors shadow-xs"
            >
              <PlusCircle className="w-2.5 h-2.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Purchased Items Card */}
          <div className="p-2 sm:p-3 rounded-xl bg-[#0a0a0a] border border-zinc-850 shadow-xs flex flex-col justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-medium block truncate">Purchases</span>
              <p className="text-xs sm:text-lg font-bold font-mono text-white tabular-nums">
                {purchases.length}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('purchases')}
              className="mt-1.5 text-[10px] sm:text-xs text-indigo-400 font-medium hover:underline flex items-center justify-center gap-0.5 py-1"
            >
              <span>Vault</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Support Desk Card */}
          <div className="p-2 sm:p-3 rounded-xl bg-[#0a0a0a] border border-zinc-850 shadow-xs flex flex-col justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-medium block truncate">Support</span>
              <p className="text-xs sm:text-lg font-bold font-mono text-white tabular-nums">
                {tickets.length}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('support')}
              className="mt-1.5 text-[10px] sm:text-xs text-indigo-400 font-medium hover:underline flex items-center justify-center gap-0.5 py-1"
            >
              <span>Tickets</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Welcome Banner for Guest Visitors */
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-zinc-950 via-[#0a0a0a] to-black border border-zinc-800 text-white p-3.5 sm:p-6 shadow-sm">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-zinc-800/80 text-zinc-300">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Instant Digital Product Delivery & Telegram WebApp</span>
            </div>
            <h1 className="text-sm sm:text-xl font-bold font-['Syne',sans-serif] tracking-tight">
              Premium Digital Goods, Developer Tools & Accounts
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
              Instant access to verified VPN suites, boilerplate source code, course bundles, and premium passes. Claim ৳50 welcome bonus upon free registration.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-black bg-white rounded-md hover:bg-zinc-200 transition-colors shadow-xs"
              >
                Create Account (+৳50 Gift)
              </button>
              <button
                onClick={() => setActiveTab('store')}
                className="px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
              >
                Browse Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 border-b border-zinc-900 scrollbar-none">
        <button
          onClick={() => setActiveTab('store')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'store'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'purchases'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>My Purchases</span>
          {purchases.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-indigo-300">
              {purchases.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'deposit'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Deposit History
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'support'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Support Desk
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PRODUCT CATALOG & STORE (2 ITEMS SIDE-BY-SIDE ON MOBILE) */}
      {/* ======================================================== */}
      {activeTab === 'store' && (
        <section className="space-y-4">
          {/* Controls: Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Category Segmented Controls */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#0a0a0a] border border-zinc-850 rounded-lg scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2 w-3 h-3 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-zinc-800 bg-[#0a0a0a] text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* Product Cards Grid: TWO ITEMS SIDE-BY-SIDE ON MOBILE (grid-cols-2) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3.5">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="group relative rounded-xl bg-[#0a0a0a] border border-zinc-850 hover:border-zinc-700 transition-all flex flex-col justify-between overflow-hidden shadow-xs"
              >
                <div>
                  {/* Lead imagery with graceful fallback for Telegram and web */}
                  <div className="aspect-[4/3] w-full bg-zinc-900 overflow-hidden relative">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div
                      style={{ display: 'none' }}
                      className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-indigo-950/40 items-center justify-center p-2 text-center flex-col gap-1"
                    >
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span className="text-[9px] font-semibold text-zinc-300 truncate max-w-full">{product.name}</span>
                    </div>
                  </div>

                  {/* Clean unboxed metadata */}
                  <div className="p-2 sm:p-3 space-y-1">
                    <div className="flex items-center gap-1 text-[9px] sm:text-[11px] text-zinc-400">
                      <span className="truncate max-w-[65px] sm:max-w-none">{product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums whitespace-nowrap">{product.validityDays}d</span>
                      <span aria-hidden="true" className="hidden sm:inline">·</span>
                      <span className="text-emerald-400 hidden sm:inline">Instant</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold font-['Syne',sans-serif] text-white group-hover:text-indigo-400 transition-colors line-clamp-1 sm:line-clamp-2 leading-tight">
                      {product.name}
                    </h3>

                    <p className="text-[10px] sm:text-xs text-zinc-400 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Price and Instant Purchase Action */}
                <div className="p-2 sm:p-3 pt-0 border-t border-zinc-900 flex items-center justify-between mt-1">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-zinc-500 block leading-none">Price</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white tabular-nums font-mono">
                      {currencySymbol}{product.price}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectProduct(product)}
                    className="flex items-center gap-0.5 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors shadow-xs"
                  >
                    <span>Buy</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-10 text-zinc-500 text-xs">
              No products found matching &quot;{searchQuery}&quot;
            </div>
          )}

          {/* Promo Code Box */}
          <div className="mt-6 p-3.5 sm:p-4 rounded-xl bg-[#0a0a0a] border border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-white">
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>Have a Promo Code or Voucher?</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Redeem codes like <strong>WELCOME100</strong> for instant wallet credits.
              </p>
            </div>

            <form onSubmit={handleRedeemPromo} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={promoCodeInput}
                onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                className="px-2.5 py-1 text-xs font-mono uppercase rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
              <button
                type="submit"
                disabled={promoLoading}
                className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {promoLoading ? '...' : 'Redeem'}
              </button>
            </form>
          </div>

          {promoStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                promoStatus.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
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
              <h2 className="text-sm sm:text-base font-bold font-['Syne',sans-serif] text-white">
                My Unlocked Digital Purchases
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Download links, configuration archives, and secret license passwords
              </p>
            </div>
            <span className="text-xs text-zinc-400 tabular-nums">
              Total {purchases.length} Items
            </span>
          </div>

          {!user ? (
            <div className="text-center py-10 p-5 rounded-xl bg-[#0a0a0a] border border-zinc-850">
              <Lock className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
              <h3 className="text-xs sm:text-sm font-semibold text-white">Please Sign In</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-3">
                Sign in to view your purchased licenses and download keys.
              </p>
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
              >
                Sign In Now
              </button>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-10 p-5 rounded-xl bg-[#0a0a0a] border border-zinc-850">
              <ShoppingBag className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
              <h3 className="text-xs sm:text-sm font-semibold text-white">No Purchases Yet</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-3">
                Browse our product catalog to buy software, accounts, or templates.
              </p>
              <button
                onClick={() => setActiveTab('store')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
              >
                Explore Products
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {purchases.map(item => (
                <div
                  key={item.id}
                  className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-zinc-850 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-zinc-400">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400 font-medium">Active License</span>
                      <span aria-hidden="true">·</span>
                      <span>Order #{item.id.slice(-6).toUpperCase()}</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      {item.productName}
                    </h3>

                    {/* Secret Password Reveal Box */}
                    {item.secretPassword && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Key className="w-2.5 h-2.5 text-amber-400" /> Key:
                        </span>
                        <code className="text-xs font-mono font-bold bg-zinc-900 text-indigo-300 px-1.5 py-0.5 rounded border border-zinc-800">
                          {item.secretPassword}
                        </code>
                        <button
                          onClick={() => copyToClipboard(item.secretPassword || '', item.id)}
                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                          title="Copy Password"
                        >
                          {copiedKey === item.id ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-zinc-500">
                      Purchased: {new Date(item.purchasedAt).toLocaleDateString()} · Expires: {new Date(item.expiresAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                    <a
                      href={item.fileDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors shadow-xs"
                    >
                      <Download className="w-3 h-3" />
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
              <h2 className="text-sm sm:text-base font-bold font-['Syne',sans-serif] text-white">
                Deposit History & Transaction Ledger
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Track all your manual bKash, Nagad, and Rocket wallet deposit requests
              </p>
            </div>
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3 h-3" />
              <span>New Deposit</span>
            </button>
          </div>

          {!user ? (
            <div className="text-center py-10 p-5 rounded-xl bg-[#0a0a0a] border border-zinc-850">
              <Lock className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
              <h3 className="text-xs sm:text-sm font-semibold text-white">Sign In to View Deposits</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-3">
                Access your deposit history and submitted Transaction IDs.
              </p>
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
              >
                Sign In Now
              </button>
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-10 p-5 rounded-xl bg-[#0a0a0a] border border-zinc-850">
              <Wallet className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
              <h3 className="text-xs sm:text-sm font-semibold text-white">No Deposits Recorded</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-3">
                You haven&apos;t submitted any deposit requests yet.
              </p>
              <button
                onClick={onOpenDeposit}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
              >
                Add Funds via bKash / Nagad
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-850 bg-[#0a0a0a]">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-850">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Method</th>
                    <th className="py-2.5 px-3 font-semibold">Amount</th>
                    <th className="py-2.5 px-3 font-semibold">Sender Number</th>
                    <th className="py-2.5 px-3 font-semibold">TrxID</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {deposits.map(dep => (
                    <tr key={dep.id} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-semibold uppercase text-white">
                        {dep.method}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold tabular-nums text-white">
                        {currencySymbol}{dep.amount}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-400">
                        {dep.senderNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-indigo-400">
                        {dep.trxId}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 tabular-nums">
                        {new Date(dep.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            dep.status === 'approved'
                              ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                              : dep.status === 'rejected'
                              ? 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
                              : 'bg-amber-950/50 text-amber-300 border border-amber-800/40'
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
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold font-['Syne',sans-serif] text-white">
              Support Desk & Help Center
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">
              Need assistance with product access or deposit verification? Submit a ticket below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Create Ticket Form */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#0a0a0a] border border-zinc-850 shadow-xs">
              <h3 className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-indigo-400" />
                <span>Open New Support Ticket</span>
              </h3>

              {ticketStatus && (
                <div className="mb-3 p-2 rounded-lg text-xs bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                  {ticketStatus}
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    placeholder="e.g. Deposit confirmation or product question"
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={ticketMessage}
                    onChange={e => setTicketMessage(e.target.value)}
                    placeholder="Provide details about your query..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={ticketLoading}
                  className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {ticketLoading ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </div>

            {/* Ticket History */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-white">
                Your Tickets ({tickets.length})
              </h3>

              {tickets.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#0a0a0a] border border-zinc-850 text-zinc-500 text-xs">
                  No support tickets found. We are here to help whenever you need!
                </div>
              ) : (
                tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="p-3 rounded-xl bg-[#0a0a0a] border border-zinc-850 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{ticket.subject}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          ticket.status === 'answered'
                            ? 'bg-emerald-950/50 text-emerald-300'
                            : ticket.status === 'closed'
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-amber-950/50 text-amber-300'
                        }`}
                      >
                        {ticket.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-zinc-400 whitespace-pre-line text-[11px]">
                      {ticket.message}
                    </p>

                    {ticket.reply && (
                      <div className="p-2 rounded-md bg-indigo-950/40 border border-indigo-800/40 space-y-0.5">
                        <span className="font-semibold text-indigo-300 block text-[10px]">
                          Staff Response:
                        </span>
                        <p className="text-indigo-200 text-[11px]">
                          {ticket.reply}
                        </p>
                      </div>
                    )}

                    <div className="text-[10px] text-zinc-600 pt-0.5">
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
