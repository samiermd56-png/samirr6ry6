import React, { useState, useEffect } from 'react';
import { PaymentGateway } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Check, Copy, AlertCircle, ArrowRight, ShieldCheck, Wallet } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol: string;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  currencySymbol,
}) => {
  const { user, refreshUser } = useAuth();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [amount, setAmount] = useState('500');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      api.getGateways()
        .then(res => {
          if (res.success && res.gateways.length > 0) {
            setGateways(res.gateways);
            setSelectedMethod(res.gateways[0].method);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentGateway = gateways.find(g => g.method === selectedMethod) || {
    method: selectedMethod,
    number: selectedMethod === 'bkash' ? '01712-345678' : selectedMethod === 'nagad' ? '01898-765432' : '01911-223344-5',
    type: 'Personal',
    instructions: `Send Money to this personal number and enter your Transaction ID (TrxID) below.`,
    minDeposit: 100,
    maxDeposit: 25000,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to submit a deposit request.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < (currentGateway.minDeposit || 100)) {
      setError(`Minimum deposit amount is ${currencySymbol}${currentGateway.minDeposit || 100}`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.submitDeposit({
        method: selectedMethod,
        accountNumber: currentGateway.number,
        senderNumber,
        trxId,
        amount: numAmount,
      });

      if (res.success) {
        setSuccess('Deposit request submitted! Once verified by our payment desk, funds will be added directly to your wallet.');
        setSenderNumber('');
        setTrxId('');
        refreshUser();
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    } catch (err: any) {
      setError(err.message || 'Deposit submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Syne',sans-serif] text-slate-900 dark:text-white">
                Add Funds to Wallet
              </h2>
              <p className="text-xs text-slate-500">
                Deposit via bKash, Nagad, or Rocket with manual TrxID verification
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg border border-rose-200/50">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 p-2.5 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200/50">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Payment Method Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Select Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('bkash')}
              className={`py-2 px-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                selectedMethod === 'bkash'
                  ? 'border-pink-500 bg-pink-50/60 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 ring-2 ring-pink-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <span className="font-bold text-sm tracking-wide">bKash</span>
              <span className="text-[10px] opacity-80">Send Money</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('nagad')}
              className={`py-2 px-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                selectedMethod === 'nagad'
                  ? 'border-amber-500 bg-amber-50/60 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <span className="font-bold text-sm tracking-wide">Nagad</span>
              <span className="text-[10px] opacity-80">Send Money</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('rocket')}
              className={`py-2 px-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                selectedMethod === 'rocket'
                  ? 'border-purple-500 bg-purple-50/60 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 ring-2 ring-purple-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <span className="font-bold text-sm tracking-wide">Rocket</span>
              <span className="text-[10px] opacity-80">Send Money</span>
            </button>
          </div>
        </div>

        {/* Selected Gateway Details Box */}
        <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {selectedMethod.toUpperCase()} {currentGateway.type} NUMBER
            </span>
            <span className="text-[11px] text-slate-500">
              Min: {currencySymbol}{currentGateway.minDeposit} · Max: {currencySymbol}{currentGateway.maxDeposit}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="font-mono text-sm font-bold tracking-wider text-slate-900 dark:text-white">
              {currentGateway.number}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(currentGateway.number)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded hover:bg-indigo-100 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            {currentGateway.instructions}
          </p>
        </div>

        {/* Deposit Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your Sending Phone Number
            </label>
            <input
              type="text"
              required
              value={senderNumber}
              onChange={e => setSenderNumber(e.target.value)}
              placeholder="e.g. 01700-123456"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount ({currencySymbol})
              </label>
              <input
                type="number"
                min={currentGateway.minDeposit || 100}
                max={currentGateway.maxDeposit || 25000}
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Transaction ID (TrxID)
              </label>
              <input
                type="text"
                required
                value={trxId}
                onChange={e => setTrxId(e.target.value.toUpperCase())}
                placeholder="e.g. 9B8A7C6D5"
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-xs"
          >
            <span>{loading ? 'Submitting...' : 'Submit Deposit for Verification'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          Deposits are reviewed and credited within 5 to 15 minutes.
        </p>
      </div>
    </div>
  );
};
