import React, { useState, useEffect } from 'react';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Key,
  Shield,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';
import { formatUsd } from '../../utils/idGenerator';
import { OrderItem, ProxyAssignment } from '../../types';
import { Modal } from '../common/Modal';

export const OrderHistoryPage: React.FC = () => {
  const { currentUser, language, settings } = useAuth();
  const t = getT(language);

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for assigned proxy details
  const [selectedProxy, setSelectedProxy] = useState<ProxyAssignment | null>(null);
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [fetchingProxy, setFetchingProxy] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: OrderItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as OrderItem));
      setOrders(list);
      setLoading(false);
    }, (err) => {
      console.warn('Orders stream note:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const handleViewCredentials = async (order: OrderItem) => {
    if (!order.proxyAssignmentId) return;
    setFetchingProxy(true);
    setProxyModalOpen(true);
    try {
      const snap = await getDoc(doc(db, 'proxyAssignments', order.proxyAssignmentId));
      if (snap.exists()) {
        setSelectedProxy(snap.data() as ProxyAssignment);
      } else {
        alert('Credentials record not found or revoked.');
        setProxyModalOpen(false);
      }
    } catch (e) {
      console.error('Error fetching proxy credentials:', e);
      alert('Failed to load proxy credentials.');
      setProxyModalOpen(false);
    } finally {
      setFetchingProxy(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
            <Layers className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black">{t.orderHistory}</h1>
        </div>
        <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
          Track all your purchased proxy packages and digital services. Click on completed orders to reveal private credentials.
        </p>
      </div>

      {/* Orders List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">{t.noOrders}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {orders.map((order) => (
              <div
                key={order.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                      {order.id}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {order.productName}
                  </h3>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>Duration: <strong className="text-slate-700 dark:text-slate-300">{order.duration}</strong></span>
                    <span>•</span>
                    <span>Paid: <strong className="text-emerald-600 dark:text-emerald-400">{formatUsd(order.amount)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'completed'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : order.status === 'pending'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {order.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {order.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                    <span className="capitalize">{order.status === 'completed' ? 'Active / Assigned' : order.status}</span>
                  </span>

                  {/* Action button */}
                  {order.status === 'completed' && order.proxyAssignmentId ? (
                    <button
                      onClick={() => handleViewCredentials(order)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{t.proxyCredentials}</span>
                    </button>
                  ) : order.status === 'pending' ? (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                      {t.pendingAssignment}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proxy Credentials Modal */}
      <Modal
        isOpen={proxyModalOpen}
        onClose={() => setProxyModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span>Private Proxy Credentials</span>
          </div>
        }
        maxWidth="lg"
      >
        {fetchingProxy ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Decrypting credentials...
          </div>
        ) : selectedProxy ? (
          <div className="space-y-5">
            {/* Top Security Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Status: <strong>Active & Ready</strong></span>
              </div>
              <span>Protocol: <strong>{selectedProxy.protocol}</strong></span>
            </div>

            {/* Credentials Card Table */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
              {/* Host & Port */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">{t.host} / IP</span>
                  <span className="font-bold text-slate-900 dark:text-white select-all">{selectedProxy.host}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedProxy.host, 'host')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 transition"
                  title="Copy host"
                >
                  {copiedField === 'host' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Port */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">{t.port}</span>
                  <span className="font-bold text-slate-900 dark:text-white select-all">{selectedProxy.port}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(String(selectedProxy.port), 'port')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 transition"
                >
                  {copiedField === 'port' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Username */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">{t.username}</span>
                  <span className="font-bold text-slate-900 dark:text-white select-all">{selectedProxy.username}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedProxy.username, 'user')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 transition"
                >
                  {copiedField === 'user' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">{t.password}</span>
                  <span className="font-bold text-slate-900 dark:text-white select-all">{selectedProxy.password}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedProxy.password, 'pass')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 transition"
                >
                  {copiedField === 'pass' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Expiry */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-sans">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">{t.expiresAt}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {selectedProxy.expiresAt ? new Date(selectedProxy.expiresAt).toLocaleString() : 'Standard Package Expiry'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick One-Click String */}
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                Standard One-Click Proxy Format
              </span>
              <div className="p-3 rounded-xl bg-slate-900 text-sky-300 font-mono text-xs break-all flex items-center justify-between gap-2 border border-slate-800">
                <span>{`${selectedProxy.protocol.toLowerCase()}://${selectedProxy.username}:${selectedProxy.password}@${selectedProxy.host}:${selectedProxy.port}`}</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${selectedProxy.protocol.toLowerCase()}://${selectedProxy.username}:${selectedProxy.password}@${selectedProxy.host}:${selectedProxy.port}`,
                      'full'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-sky-500 text-white font-bold text-xs shrink-0 flex items-center gap-1 hover:bg-sky-600 transition font-sans"
                >
                  {copiedField === 'full' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {selectedProxy.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong>Admin Note:</strong> {selectedProxy.notes}
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
