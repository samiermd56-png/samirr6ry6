import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { X, CheckCircle, ShieldCheck, Clock, Layers, Sparkles, AlertCircle, ShoppingBag } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  currencySymbol: string;
  onPurchaseSuccess: () => void;
  onOpenDeposit: () => void;
  onOpenAuth: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  currencySymbol,
  onPurchaseSuccess,
  onOpenDeposit,
  onOpenAuth,
}) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!product) return null;

  const canAfford = user && user.balance >= product.price;

  const handleBuy = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!canAfford) {
      setError(`Insufficient wallet balance. You need ${currencySymbol}${product.price}. Please deposit funds.`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.buyProduct(product.id);
      if (res.success) {
        setSuccess('Order completed! Your credentials and download link have been unlocked in "My Purchases".');
        refreshUser();
        onPurchaseSuccess();
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image & Key Specs */}
          <div>
            <div className="aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-800 relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback styled visual container
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Spec strip */}
            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Validity Period
                </span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {product.validityDays} Days
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> Category
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {product.category}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Stock Status
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {product.stock > 0 ? `${product.stock} units available` : 'Unlimited / In Stock'}
                </span>
              </div>
            </div>
          </div>

          {/* Contiguous Purchase Module */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span>{product.validityDays} Days License</span>
              </div>

              <h1 className="text-lg font-bold font-['Syne',sans-serif] text-slate-900 dark:text-white leading-snug">
                {product.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">
                  {currencySymbol}{product.price}
                </span>
                <span className="text-xs text-slate-400">One-time payment</span>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                  Product Description & Inclusions:
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg border border-rose-200/50">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mt-3 flex items-center gap-2 p-2.5 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200/50">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500">Your Wallet Balance:</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {currencySymbol}{user.balance.toFixed(0)}
                    </span>
                  </div>

                  <button
                    onClick={handleBuy}
                    disabled={loading}
                    className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{loading ? 'Processing...' : `Buy Instantly for ${currencySymbol}${product.price}`}</span>
                  </button>

                  {/* If user doesn't have enough balance, show quick deposit button */}
                  {!canAfford && (
                    <button
                      onClick={onOpenDeposit}
                      type="button"
                      className="w-full py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg transition-colors"
                    >
                      + Deposit Funds via bKash / Nagad
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-xs"
                >
                  Sign In to Purchase
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
