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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0a0a0a] p-4 sm:p-6 shadow-2xl border border-zinc-800 transition-colors max-h-[92vh] overflow-y-auto text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Product Image & Key Specs */}
          <div>
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div
                style={{ display: 'none' }}
                className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-indigo-950/40 items-center justify-center p-3 text-center flex-col gap-1.5"
              >
                <Layers className="w-6 h-6 text-indigo-400" />
                <span className="text-xs font-semibold text-zinc-300">{product.name}</span>
              </div>
            </div>

            {/* Spec strip */}
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-zinc-500" /> Validity Period
                </span>
                <span className="font-semibold text-white tabular-nums">
                  {product.validityDays} Days
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-zinc-500" /> Category
                </span>
                <span className="font-semibold text-white">
                  {product.category}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Stock Status
                </span>
                <span className="font-semibold text-emerald-400">
                  {product.stock > 0 ? `${product.stock} units available` : 'Unlimited / In Stock'}
                </span>
              </div>
            </div>
          </div>

          {/* Contiguous Purchase Module */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span>{product.validityDays} Days License</span>
              </div>

              <h1 className="text-base sm:text-lg font-bold font-['Syne',sans-serif] text-white leading-snug">
                {product.name}
              </h1>

              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-white tabular-nums font-mono">
                  {currencySymbol}{product.price}
                </span>
                <span className="text-xs text-zinc-400">One-time payment</span>
              </div>

              <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-zinc-950 border border-zinc-850">
                <h4 className="text-xs font-semibold text-zinc-300 mb-1">
                  Product Description:
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 p-2 text-xs text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800/40">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mt-3 flex items-center gap-2 p-2 text-xs text-emerald-300 bg-emerald-950/40 rounded-lg border border-emerald-800/40">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-zinc-900 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">Your Wallet Balance:</span>
                    <span className="font-bold text-white tabular-nums">
                      {currencySymbol}{user.balance.toFixed(0)}
                    </span>
                  </div>

                  <button
                    onClick={handleBuy}
                    disabled={loading}
                    className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>{loading ? 'Processing...' : `Buy Instantly for ${currencySymbol}${product.price}`}</span>
                  </button>

                  {!canAfford && (
                    <button
                      onClick={onOpenDeposit}
                      type="button"
                      className="w-full py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-800/40"
                    >
                      + Deposit Funds via bKash / Nagad
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-xs"
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
