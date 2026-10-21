import React, { useState, useEffect } from 'react';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  ShieldCheck,
  Calendar,
  Wallet,
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';
import { formatUsd } from '../../utils/idGenerator';
import { TransactionItem, TransactionType } from '../../types';

export const TransactionHistoryPage: React.FC = () => {
  const { currentUser, language } = useAuth();
  const t = getT(language);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: TransactionItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as TransactionItem));
      setTransactions(list);
      setLoading(false);
    }, (err) => {
      console.warn('Transactions stream note:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter === 'all') return true;
    return tx.type === typeFilter;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-sky-600 to-teal-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
            <History className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black">{t.navTransactions}</h1>
        </div>
        <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
          Complete, tamper-proof audit trail of every balance deduction, deposit credit, and refund event.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
            typeFilter === 'all'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          All Activity ({transactions.length})
        </button>
        <button
          onClick={() => setTypeFilter('deposit')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
            typeFilter === 'deposit'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Deposits
        </button>
        <button
          onClick={() => setTypeFilter('purchase')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
            typeFilter === 'purchase'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Purchases
        </button>
      </div>

      {/* Ledger Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Loading transaction ledger...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">{t.noTransactions}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="pb-3 pl-2">Event</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3 text-right">Balance Change</th>
                  <th className="pb-3 pr-2 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-xl ${
                            tx.amount >= 0
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {tx.amount >= 0 ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="capitalize font-bold text-slate-800 dark:text-slate-200">
                          {tx.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-slate-400">
                      {tx.referenceId}
                    </td>
                    <td className="py-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 text-right font-bold">
                      <span
                        className={
                          tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                        }
                      >
                        {tx.amount >= 0 ? `+${formatUsd(tx.amount)}` : formatUsd(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right font-mono font-bold text-slate-600 dark:text-slate-300">
                      {formatUsd(tx.balanceAfter)}
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
