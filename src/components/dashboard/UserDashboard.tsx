import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  ShoppingBag,
  History,
  User as UserIcon,
  Send,
  Zap,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';
import { formatUsd } from '../../utils/idGenerator';
import { TransactionItem, OrderItem, ProxyAssignment } from '../../types';

interface UserDashboardProps {
  onNavigate: (tab: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, openAuthModal, language, settings } = useAuth();
  const t = getT(language);

  const [copiedId, setCopiedId] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [activeProxies, setActiveProxies] = useState<ProxyAssignment[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to recent transactions
    const txQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubTx = onSnapshot(txQuery, (snap) => {
      const list: TransactionItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as TransactionItem));
      setRecentTransactions(list);
    }, (err) => console.warn('Tx snapshot note:', err));

    // Listen to active proxy credentials
    const proxyQuery = query(
      collection(db, 'proxyAssignments'),
      where('userId', '==', currentUser.uid),
      where('status', '==', 'active'),
      limit(3)
    );
    const unsubProxy = onSnapshot(proxyQuery, (snap) => {
      const list: ProxyAssignment[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ProxyAssignment));
      setActiveProxies(list);
    }, (err) => console.warn('Proxy snapshot note:', err));

    // Listen to recent orders
    const orderQuery = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(4)
    );
    const unsubOrder = onSnapshot(orderQuery, (snap) => {
      const list: OrderItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as OrderItem));
      setRecentOrders(list);
    }, (err) => console.warn('Order snapshot note:', err));

    return () => {
      unsubTx();
      unsubProxy();
      unsubOrder();
    };
  }, [currentUser]);

  const handleCopyUserId = () => {
    if (userProfile?.userId) {
      navigator.clipboard.writeText(userProfile.userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const telegramLink = settings?.supportTelegram || 'https://t.me/Proxy_bazar_c';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Notice Banner */}
      {settings?.noticeBanner && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
              {language === 'bn' && settings.noticeBannerBn ? settings.noticeBannerBn : settings.noticeBanner}
            </p>
          </div>
          <a
            href={telegramLink}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shrink-0 shadow-sm transition"
          >
            <span>Telegram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Main Balance & User Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-900/40 shadow-2xl">
        {/* Glow circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-purple-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-sky-500/20">
                {userProfile?.displayName?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                    {userProfile ? `${t.welcomeBack}, ${userProfile.displayName}` : 'Welcome to Proxy Bazar'}
                  </h1>
                  {userProfile && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {t.statusActive}
                    </span>
                  )}
                </div>
                {userProfile ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{t.userIdLabel}:</span>
                    <button
                      onClick={handleCopyUserId}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-sky-300 font-mono text-xs font-semibold transition"
                      title="Click to copy User ID"
                    >
                      <span>{userProfile.userId}</span>
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sign in to access your wallet, private proxies, and digital orders.
                  </p>
                )}
              </div>
            </div>

            {!currentUser && (
              <button
                onClick={() => openAuthModal('signin')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-slate-950 font-bold text-xs shadow-lg transition"
              >
                {t.signIn} / {t.signUp}
              </button>
            )}
          </div>

          {/* Metric Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6">
            {/* Available Balance */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm relative group hover:border-sky-500/40 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{t.availableBalance}</span>
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-sky-300 transition">
                {currentUser ? formatUsd(userProfile?.balance || 0) : '$0.00'}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">USDT BEP20 Wallet</span>
                <button
                  onClick={() => currentUser ? onNavigate('deposit') : openAuthModal('signin')}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 group-hover:translate-x-0.5 transition"
                >
                  <span>+ Deposit</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Total Deposited */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{t.totalDeposits}</span>
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-emerald-300 transition">
                {currentUser ? formatUsd(userProfile?.totalDeposited || 0) : '$0.00'}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Lifetime verified blockchain deposits
              </p>
            </div>

            {/* Total Purchases */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:border-purple-500/40 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{t.totalPurchases}</span>
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-purple-300 transition">
                {currentUser ? formatUsd(userProfile?.totalPurchased || 0) : '$0.00'}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Total spent on proxies & digital products
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Prominent Action Tiles Required by Brief */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          <span>{t.quickActions}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Proxy Buy */}
          <button
            onClick={() => onNavigate('proxies')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/60 dark:hover:border-sky-500/60 shadow-xs hover:shadow-lg transition group active:scale-95 text-center"
          >
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition duration-300 mb-2.5">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition">
              {t.actionProxyBuy}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">From $0.15</span>
          </button>

          {/* 2. Digital Products */}
          <button
            onClick={() => onNavigate('products')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/60 dark:hover:border-purple-500/60 shadow-xs hover:shadow-lg transition group active:scale-95 text-center"
          >
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition duration-300 mb-2.5">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-500 transition">
              {t.actionDigitalProducts}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">SOCKS5, ISP, APIs</span>
          </button>

          {/* 3. Deposit */}
          <button
            onClick={() => onNavigate('deposit')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-lg transition group active:scale-95 text-center"
          >
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition duration-300 mb-2.5">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition">
              {t.actionDeposit}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">USDT BEP20</span>
          </button>

          {/* 4. Transaction History */}
          <button
            onClick={() => onNavigate('transactions')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-lg transition group active:scale-95 text-center"
          >
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition duration-300 mb-2.5">
              <History className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 transition">
              {t.actionHistory}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Immutable Ledger</span>
          </button>

          {/* 5. My Profile */}
          <button
            onClick={() => onNavigate('profile')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/60 dark:hover:border-sky-500/60 shadow-xs hover:shadow-lg transition group active:scale-95 text-center"
          >
            <div className="p-3 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-300 group-hover:bg-slate-700 group-hover:text-white transition duration-300 mb-2.5">
              <UserIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition">
              {t.actionProfile}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Security & ID</span>
          </button>

          {/* 6. Contact Support */}
          <a
            href={telegramLink}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-400 shadow-xs hover:shadow-lg transition group active:scale-95 text-center"
          >
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition duration-300 mb-2.5">
              <Send className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition">
              {t.actionSupport}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">@Proxy_bazar_c</span>
          </a>
        </div>
      </div>

      {/* Active Proxies Credentials Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t.activeProxies}
            </h3>
          </div>
          {activeProxies.length > 0 && (
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              {t.viewAll}
            </button>
          )}
        </div>

        {activeProxies.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Shield className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {t.noActiveProxies}
            </p>
            <button
              onClick={() => onNavigate('proxies')}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition"
            >
              {t.actionProxyBuy}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProxies.map((p) => {
              const proxyString = `${p.protocol.toLowerCase()}://${p.username}:${p.password}@${p.host}:${p.port}`;
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {p.packageDuration}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      {p.protocol}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP:Port:</span>
                      <span className="font-semibold text-slate-900 dark:text-white select-all">
                        {p.host}:{p.port}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">User:</span>
                      <span className="font-semibold select-all">{p.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pass:</span>
                      <span className="font-semibold select-all">{p.password}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(proxyString);
                      alert('Copied proxy string to clipboard!');
                    }}
                    className="w-full py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copyProxyString}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two-Column Activity: Recent Transactions & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t.recentTransactions}
            </h3>
            {recentTransactions.length > 0 && (
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                {t.viewAll}
              </button>
            )}
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">{t.noTransactions}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        tx.amount >= 0
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {tx.amount >= 0 ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs">
                        {tx.description}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-black ${
                        tx.amount >= 0 ? 'text-emerald-500' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {tx.amount >= 0 ? `+${formatUsd(tx.amount)}` : formatUsd(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Bal: {formatUsd(tx.balanceAfter)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t.orderHistory}
            </h3>
            {recentOrders.length > 0 && (
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                {t.viewAll}
              </button>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">{t.noOrders}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {ord.productName}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ord.id} • {ord.duration}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {formatUsd(ord.amount)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        ord.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : ord.status === 'pending'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {ord.status === 'completed' ? 'Active' : ord.status === 'pending' ? 'Pending' : ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
