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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0a0a0a] p-4 sm:p-6 shadow-2xl border border-zinc-800 text-white transition-colors max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-['Syne',sans-serif] text-white">
                Add Funds to Wallet
              </h2>
              <p className="text-[11px] text-zinc-400">
                Deposit via bKash, Nagad, or Rocket with manual TrxID verification
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 p-2 text-xs text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800/40">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-3 flex items-center gap-2 p-2 text-xs text-emerald-300 bg-emerald-950/40 rounded-lg border border-emerald-800/40">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Payment Method Selector */}
        <div className="mb-3.5">
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
            Select Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('bkash')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg border flex flex-col items-center gap-0.5 transition-all ${
                selectedMethod === 'bkash'
                  ? 'border-pink-500 bg-pink-950/40 text-pink-300 ring-1 ring-pink-500/40'
                  : 'border-zinc-850 text-zinc-400 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <span className="font-bold text-xs">bKash</span>
              <span className="text-[9px] opacity-75">Send Money</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('nagad')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg border flex flex-col items-center gap-0.5 transition-all ${
                selectedMethod === 'nagad'
                  ? 'border-amber-500 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/40'
                  : 'border-zinc-850 text-zinc-400 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <span className="font-bold text-xs">Nagad</span>
              <span className="text-[9px] opacity-75">Send Money</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('rocket')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg border flex flex-col items-center gap-0.5 transition-all ${
                selectedMethod === 'rocket'
                  ? 'border-purple-500 bg-purple-950/40 text-purple-300 ring-1 ring-purple-500/40'
                  : 'border-zinc-850 text-zinc-400 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <span className="font-bold text-xs">Rocket</span>
              <span className="text-[9px] opacity-75">Send Money</span>
            </button>
          </div>
        </div>

        {/* Selected Gateway Details Box */}
        <div className="mb-3.5 p-3 rounded-xl bg-zinc-950 border border-zinc-850">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
              {selectedMethod.toUpperCase()} {currentGateway.type} NUMBER
            </span>
            <span className="text-[10px] text-zinc-400">
              Min: {currencySymbol}{currentGateway.minDeposit} · Max: {currencySymbol}{currentGateway.maxDeposit}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-black border border-zinc-800">
            <span className="font-mono text-xs font-bold tracking-wider text-white">
              {currentGateway.number}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(currentGateway.number)}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-indigo-300 bg-indigo-950/60 rounded hover:bg-indigo-900/60 transition-colors"
            >
              {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="mt-1.5 text-[10px] text-zinc-400 leading-relaxed">
            {currentGateway.instructions}
          </p>
        </div>

        {/* Deposit Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Your Sending Phone Number
            </label>
            <input
              type="text"
              required
              value={senderNumber}
              onChange={e => setSenderNumber(e.target.value)}
              placeholder="e.g. 01700-123456"
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
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
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Transaction ID (TrxID)
              </label>
              <input
                type="text"
                required
                value={trxId}
                onChange={e => setTrxId(e.target.value.toUpperCase())}
                placeholder="e.g. 9B8A7C6D5"
                className="w-full px-2.5 py-1.5 text-xs font-mono uppercase rounded-md border border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-xs"
          >
            <span>{loading ? 'Submitting...' : 'Submit Deposit for Verification'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>

        <p className="mt-2.5 text-center text-[10px] text-zinc-500">
          Deposits are reviewed and credited within 5 to 15 minutes.
        </p>
      </div>
    </div>
  );
};
