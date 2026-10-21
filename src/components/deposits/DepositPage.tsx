import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  ShieldAlert,
  ArrowRight,
  QrCode,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';
import { formatUsd } from '../../utils/idGenerator';
import { DepositItem } from '../../types';
import { submitDeposit } from '../../services/api';

export const DepositPage: React.FC = () => {
  const { currentUser, userProfile, openAuthModal, language, settings } = useAuth();
  const t = getT(language);

  const depositAddress = settings?.usdtBep20Address || '0x88e7A26d03f0b2fB144FE8d37452d7eC1dE126e8';
  const minDeposit = settings?.minDepositUsdt || 0.50;

  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState<string>('5.00');
  const [txHash, setTxHash] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Listen to user's deposit history
  useEffect(() => {
    if (!currentUser) {
      setLoadingHistory(false);
      return;
    }

    const q = query(
      collection(db, 'deposits'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: DepositItem[] = [];
      snap.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as DepositItem);
      });
      setDeposits(list);
      setLoadingHistory(false);
    }, (err) => {
      console.warn('Deposits listener note:', err);
      setLoadingHistory(false);
    });

    return () => unsub();
  }, [currentUser]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal('signin');
      return;
    }

    setError(null);
    setSuccess(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < minDeposit) {
      setError(`Minimum deposit amount is $${minDeposit.toFixed(2)} USDT.`);
      return;
    }

    const cleanHash = txHash.trim();
    if (!cleanHash || cleanHash.length < 15) {
      setError('Please enter a valid BSC Transaction Hash (TxID).');
      return;
    }

    setLoading(true);

    try {
      await submitDeposit(numAmount, cleanHash, depositAddress);
      setSuccess(t.depositSubmitted);
      setTxHash('');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } catch (err: any) {
      console.error('Deposit error:', err);
      setError(err.message || 'Failed to submit deposit request.');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code URL
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${depositAddress}`;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-100 text-xs font-bold mb-3 border border-white/20">
            <Wallet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Manual Blockchain Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            {t.depositTitle}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            {t.depositSubtitle}
          </p>
        </div>
      </div>

      {/* Main Deposit Form & Address Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Wallet Address & Instructions (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          {/* Network Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Network
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black">
              USDT (BEP20 / BSC)
            </span>
          </div>

          {/* QR Code & Address */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200 dark:border-slate-800 shadow-sm mb-3">
              <img
                src={qrUrl}
                alt="Deposit Address QR"
                className="w-36 h-36 rounded-lg object-contain"
                loading="lazy"
              />
            </div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold mb-1">
              {t.depositAddress}
            </span>
            <div className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white break-all select-all mb-3 font-semibold">
              {depositAddress}
            </div>
            <button
              onClick={handleCopyAddress}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t.copy} Address</span>
                </>
              )}
            </button>
          </div>

          {/* Network Warning */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex gap-3 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold mb-0.5">Strict Network Requirement</p>
              <p>{t.networkWarning}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Submit Request Form (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Submit Deposit Details
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  After sending USDT from your wallet, paste the BSC TxID below.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Min Deposit</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatUsd(minDeposit)}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3 text-emerald-700 dark:text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDeposit} className="space-y-5">
              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.amountLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min={minDeposit}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5.00"
                    className="w-full pl-8 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                    USDT
                  </div>
                </div>
                {/* Preset quick buttons */}
                <div className="flex gap-2 mt-2">
                  {['1.00', '3.00', '5.00', '10.00', '25.00'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Hash */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.txHashLabel}
                </label>
                <input
                  type="text"
                  required
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder={t.txHashPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Find this in your Binance, Trust Wallet, or MetaMask transfer history.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{t.submitDeposit}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>🛡️ Verifications processed within 5-15 mins</span>
            <a
              href={settings?.supportTelegram || 'https://t.me/Proxy_bazar_c'}
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Need Help? Telegram</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Deposit History Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
          {t.depositHistory}
        </h3>

        {loadingHistory ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Loading your deposit records...
          </div>
        ) : deposits.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {t.noDeposits}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="pb-3 pl-2">Deposit ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Network</th>
                  <th className="pb-3">Tx Hash</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {deposits.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 pl-2 font-mono font-bold text-slate-900 dark:text-white">
                      {item.id}
                    </td>
                    <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatUsd(item.amount)}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">
                      USDT BEP20
                    </td>
                    <td className="py-3.5 font-mono text-slate-500">
                      <a
                        href={`https://bscscan.com/tx/${item.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{item.txHash.slice(0, 8)}...{item.txHash.slice(-6)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : item.status === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {item.status === 'pending' && <Clock className="w-3 h-3" />}
                        {item.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        <span className="capitalize">{item.status}</span>
                      </span>
                      {item.adminNotes && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          Note: {item.adminNotes}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
