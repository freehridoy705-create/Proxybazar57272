import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Check,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Wallet,
  Sparkles,
  ExternalLink,
  Filter,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';
import { formatUsd, generateIdempotencyKey } from '../../utils/idGenerator';
import { ProductItem } from '../../types';
import { purchaseProduct } from '../../services/api';
import { Modal } from '../common/Modal';
import { DEFAULT_PROXY_PACKAGES } from '../../services/seedData';

interface ProxyBuyPageProps {
  onNavigate: (tab: string) => void;
}

export const ProxyBuyPage: React.FC<ProxyBuyPageProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, openAuthModal, language } = useAuth();
  const t = getT(language);

  const [packages, setPackages] = useState<ProductItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<ProductItem | null>(null);

  // Purchase Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Duration Category Filter State: 'all' | 'super' | 'short' | 'medium' | 'long'
  const [durationFilter, setDurationFilter] = useState<'all' | 'super' | 'short' | 'medium' | 'long'>('all');

  const getDurationCategory = (pkg: ProductItem): 'short' | 'medium' | 'long' => {
    const hours = pkg.durationHours !== undefined
      ? pkg.durationHours
      : pkg.duration.toLowerCase().includes('month')
      ? 720
      : pkg.duration.toLowerCase().includes('day')
      ? 24
      : parseFloat(pkg.duration) || 1;

    if (hours <= 3.5) return 'short';
    if (hours <= 12) return 'medium';
    return 'long';
  };

  const allCount = packages.length;
  const superCount = packages.filter((p) => p.isSuperProxy || p.category === 'proxy_super').length;
  const shortCount = packages.filter((p) => getDurationCategory(p) === 'short').length;
  const mediumCount = packages.filter((p) => getDurationCategory(p) === 'medium').length;
  const longCount = packages.filter((p) => getDurationCategory(p) === 'long').length;

  const filteredPackages = packages.filter((pkg) => {
    if (durationFilter === 'all') return true;
    if (durationFilter === 'super') return pkg.isSuperProxy || pkg.category === 'proxy_super';
    return getDurationCategory(pkg) === durationFilter;
  });

  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('category', 'in', ['proxy_time', 'proxy_super']),
      orderBy('sortOrder', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list: ProductItem[] = [];
        snap.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as ProductItem);
        });
        setPackages(list.filter((p) => p.active));
      } else {
        // Fallback to default packages if database is being seeded
        setPackages(DEFAULT_PROXY_PACKAGES.map((p, i) => ({ ...p, id: `pkg-${i}` })));
      }
      setLoadingPackages(false);
    }, (err) => {
      console.warn('Proxy packages listener note:', err);
      setPackages(DEFAULT_PROXY_PACKAGES.map((p, i) => ({ ...p, id: `pkg-${i}` })));
      setLoadingPackages(false);
    });

    return () => unsub();
  }, []);

  const handleSelectPackage = (pkg: ProductItem) => {
    if (!currentUser) {
      openAuthModal('signin');
      return;
    }
    setSelectedPackage(pkg);
    setPurchaseError(null);
    setPurchaseSuccess(null);
    setIdempotencyKey(generateIdempotencyKey());
    setConfirmModalOpen(true);
  };

  const handleExecutePurchase = async () => {
    if (!selectedPackage || !currentUser) return;

    const userBalance = Number(userProfile?.balance || 0);
    if (userBalance < selectedPackage.price) {
      setPurchaseError(t.insufficientBalance);
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      const res = await purchaseProduct({
        productId: selectedPackage.id,
        productName: selectedPackage.title,
        category: selectedPackage.category,
        duration: selectedPackage.duration,
        price: selectedPackage.price,
        idempotencyKey,
      });

      if (res.success) {
        setPurchaseSuccess(t.purchaseSuccess);
        setConfirmedOrderId(res.orderId);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore confetti if not available
        }
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      if (err.message === 'INSUFFICIENT_BALANCE') {
        setPurchaseError(t.insufficientBalance);
      } else {
        setPurchaseError(err.message || 'Failed to complete transaction.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const currentBal = Number(userProfile?.balance || 0);
  const isBalanceEnough = selectedPackage ? currentBal >= selectedPackage.price : false;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sky-200 text-xs font-bold mb-3 border border-white/20">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Instant Automated Assignment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            {t.packageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
            {t.packageSubtitle}
          </p>
        </div>
      </div>

      {/* Duration Category Segmented Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Filter className="w-4 h-4 text-sky-500 shrink-0" />
          <span className="whitespace-nowrap">Filter Duration:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {/* All */}
          <button
            type="button"
            onClick={() => setDurationFilter('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              durationFilter === 'all'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{t.filterAll}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                durationFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {allCount}
            </span>
          </button>

          {/* Super Proxy 1 Month USA */}
          <button
            type="button"
            onClick={() => setDurationFilter('super')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              durationFilter === 'super'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 text-white shadow-md'
                : 'text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30'
            }`}
            title={t.superProxySubtitle}
          >
            <span>{t.filterSuperProxy}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                durationFilter === 'super'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300'
              }`}
            >
              {superCount}
            </span>
          </button>

          {/* Short-term */}
          <button
            type="button"
            onClick={() => setDurationFilter('short')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              durationFilter === 'short'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={t.shortTermSubtitle}
          >
            <span>{t.filterShortTerm}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                durationFilter === 'short'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {shortCount}
            </span>
          </button>

          {/* Medium-term */}
          <button
            type="button"
            onClick={() => setDurationFilter('medium')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              durationFilter === 'medium'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={t.mediumTermSubtitle}
          >
            <span>{t.filterMediumTerm}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                durationFilter === 'medium'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {mediumCount}
            </span>
          </button>

          {/* Long-term */}
          <button
            type="button"
            onClick={() => setDurationFilter('long')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              durationFilter === 'long'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={t.longTermSubtitle}
          >
            <span>{t.filterLongTerm}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                durationFilter === 'long'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {longCount}
            </span>
          </button>
        </div>
      </div>

      {/* Package Pricing Cards Grid */}
      {loadingPackages ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-72 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t.noPackagesInFilter}
          </p>
          <button
            type="button"
            onClick={() => setDurationFilter('all')}
            className="mt-4 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetFilter}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {filteredPackages.map((pkg) => {
            const isSuper = pkg.isSuperProxy || pkg.category === 'proxy_super';
            const isPopular = pkg.popular && !isSuper;

            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl transition-all duration-300 flex flex-col justify-between p-5 hover:shadow-2xl group ${
                  isSuper
                    ? 'bg-gradient-to-b from-purple-500/10 via-white dark:via-slate-900 to-white dark:to-slate-900 border-2 border-purple-500 shadow-xl shadow-purple-500/15 ring-2 ring-purple-500/30'
                    : isPopular
                    ? 'bg-white dark:bg-slate-900 border border-sky-500 shadow-md shadow-sky-500/10 ring-2 ring-sky-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50'
                }`}
              >
                {/* Badge */}
                {(pkg.badge || isSuper) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                        isSuper
                          ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-white shadow-purple-500/30 ring-1 ring-white/30'
                          : isPopular
                          ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {pkg.badge || '⚡ Super Proxy'}
                    </span>
                  </div>
                )}

                <div>
                  {/* Duration & Title */}
                  <div className="mt-2 text-center pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{pkg.duration}</span>
                      {pkg.country && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
                          🇺🇸 {pkg.country}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {language === 'bn' && pkg.titleBn ? pkg.titleBn : pkg.title}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="my-5 text-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {formatUsd(pkg.price)}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5 font-medium">
                      {isSuper ? '1 Month Dedicated' : 'One-time payment'}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {(language === 'bn' && pkg.featuresBn ? pkg.featuresBn : pkg.features).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Select Button */}
                <button
                  type="button"
                  onClick={() => handleSelectPackage(pkg)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95 ${
                    isSuper
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-700 hover:to-sky-700 text-white font-black shadow-lg shadow-purple-500/25 ring-1 ring-white/20'
                      : isPopular
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>
                    {isSuper
                      ? `Buy 1 Month USA (${formatUsd(pkg.price)})`
                      : t.selectPackage}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Trust & Guarantee Info Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Confidential Credentials</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Only you can view your assigned proxy IPs and credentials. 100% private.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">High Concurrency</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              1 Gbps port throughput designed for browsing, multi-session automation & survey tasks.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Atomic Transaction Safety</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ACID database transactions protect against double charges and balance desync.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation & Checkout Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => {
          if (!purchasing) setConfirmModalOpen(false);
        }}
        title={t.confirmPurchase}
        maxWidth="md"
      >
        {selectedPackage && (
          <div className="space-y-5">
            {purchaseSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {purchaseSuccess}
                  </p>
                  {confirmedOrderId && (
                    <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      Order ID: {confirmedOrderId}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      setConfirmModalOpen(false);
                      onNavigate('orders');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-md transition"
                  >
                    View in My Orders
                  </button>
                  <button
                    onClick={() => setConfirmModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Package Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">Package</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {selectedPackage.title}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">Duration</span>
                      <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
                        {selectedPackage.duration}
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Package Price:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatUsd(selectedPackage.price)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>{t.availableBalance}:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatUsd(currentBal)}
                      </span>
                    </div>

                    <div className="border-t border-slate-200/60 dark:border-slate-800 pt-2 flex justify-between font-bold">
                      <span>Balance after purchase:</span>
                      <span
                        className={
                          isBalanceEnough ? 'text-emerald-500' : 'text-rose-500'
                        }
                      >
                        {isBalanceEnough
                          ? formatUsd(currentBal - selectedPackage.price)
                          : 'Insufficient Balance'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {purchaseError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{purchaseError}</p>
                      {!isBalanceEnough && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModalOpen(false);
                            onNavigate('deposit');
                          }}
                          className="mt-2 inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          <span>Go to Deposit Page</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Idempotency Protection Notice */}
                <p className="text-[11px] text-slate-400 text-center">
                  Protected with atomic transaction deduplication key: <span className="font-mono text-[10px]">{idempotencyKey.slice(0, 14)}...</span>
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={purchasing}
                    onClick={() => setConfirmModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>

                  {isBalanceEnough ? (
                    <button
                      type="button"
                      disabled={purchasing}
                      onClick={handleExecutePurchase}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {purchasing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>{t.confirmPurchase}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalOpen(false);
                        onNavigate('deposit');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Deposit USDT</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
