import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Send,
  Sliders,
  FileText,
  Key,
  Layers,
  ShoppingBag,
  Loader2,
  Check,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { formatUsd } from '../../utils/idGenerator';
import {
  UserProfile,
  DepositItem,
  OrderItem,
  ProductItem,
  PlatformSettings,
  AuditLogItem,
  ProxyProtocol,
} from '../../types';
import {
  adminApproveDeposit,
  adminRejectDeposit,
  adminAssignProxy,
  adminToggleUserStatus,
  adminSendNotification,
  adminSaveSettings,
  adminSaveProduct,
} from '../../services/api';
import { Modal } from '../common/Modal';

export const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin, settings } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'deposits' | 'orders' | 'products' | 'users' | 'settings' | 'audit'
  >('overview');

  // Real-time collections
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search queries
  const [userSearch, setUserSearch] = useState('');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<OrderItem | null>(null);
  const [assignHost, setAssignHost] = useState('');
  const [assignPort, setAssignPort] = useState('8080');
  const [assignUser, setAssignUser] = useState('');
  const [assignPass, setAssignPass] = useState('');
  const [assignProtocol, setAssignProtocol] = useState<ProxyProtocol>('SOCKS5');
  const [assignExpiryDays, setAssignExpiryDays] = useState('1');
  const [assignLoading, setAssignLoading] = useState(false);

  // Deposit review modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDepositForReview, setSelectedDepositForReview] = useState<DepositItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Transaction hash not found on BSC');
  const [actionLoading, setActionLoading] = useState(false);

  // Product edit modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductItem>>({});
  const [productLoading, setProductLoading] = useState(false);

  // Send Notification modal
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifTargetUserId, setNotifTargetUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);

  // Settings form
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsMinDeposit, setSettingsMinDeposit] = useState('0.50');
  const [settingsTelegram, setSettingsTelegram] = useState('');
  const [settingsBanner, setSettingsBanner] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setSettingsAddress(settings.usdtBep20Address || '');
      setSettingsMinDeposit(String(settings.minDepositUsdt || 0.50));
      setSettingsTelegram(settings.supportTelegram || '');
      setSettingsBanner(settings.noticeBanner || '');
    }
  }, [settings]);

  // Listen to Firestore
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    // Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      setUsers(list);
    }, (err) => console.warn('Admin users snap note:', err));

    // Deposits
    const unsubDeposits = onSnapshot(query(collection(db, 'deposits'), orderBy('createdAt', 'desc')), (snap) => {
      const list: DepositItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as DepositItem));
      setDeposits(list);
    }, (err) => console.warn('Admin deposits snap note:', err));

    // Orders
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      const list: OrderItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as OrderItem));
      setOrders(list);
    }, (err) => console.warn('Admin orders snap note:', err));

    // Products
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('sortOrder', 'asc')), (snap) => {
      const list: ProductItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ProductItem));
      setProducts(list);
    }, (err) => console.warn('Admin products snap note:', err));

    // Audit logs
    const unsubAudit = onSnapshot(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc')), (snap) => {
      const list: AuditLogItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as AuditLogItem));
      setAuditLogs(list);
      setLoading(false);
    }, (err) => {
      console.warn('Admin audit snap note:', err);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubDeposits();
      unsubOrders();
      unsubProducts();
      unsubAudit();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Administrator Access Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          This portal is strictly restricted to authorized administrators (<code className="text-sky-500">hridoy152008@gmail.com</code> and authorized staff). Please sign in with an authorized account.
        </p>
      </div>
    );
  }

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'completed' || o.status === 'pending' ? o.amount : 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const pendingDepositsCount = deposits.filter((d) => d.status === 'pending').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;

  // Actions
  const handleApproveDeposit = async (dep: DepositItem) => {
    if (!window.confirm(`Approve deposit of $${dep.amount.toFixed(2)} USDT for ${dep.userEmail}? This will credit their account balance immediately.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await adminApproveDeposit(dep.id);
      alert('Deposit approved and user balance credited atomically!');
    } catch (e: any) {
      alert('Error approving deposit: ' + (e.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (dep: DepositItem) => {
    setSelectedDepositForReview(dep);
    setRejectReason('Transaction hash invalid or not confirmed on BSC.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedDepositForReview) return;
    setActionLoading(true);
    try {
      await adminRejectDeposit(selectedDepositForReview.id, rejectReason);
      setRejectModalOpen(false);
      alert('Deposit request marked as rejected.');
    } catch (e: any) {
      alert('Error rejecting deposit: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAssignModal = (order: OrderItem) => {
    setSelectedOrderForAssign(order);
    // Pre-fill generated credentials
    const randHost = `194.26.${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 250 + 1)}`;
    const randUser = `pb_usr_${Math.random().toString(36).substring(2, 7)}`;
    const randPass = Math.random().toString(36).substring(2, 10);
    setAssignHost(randHost);
    setAssignPort('1080');
    setAssignUser(randUser);
    setAssignPass(randPass);
    setAssignProtocol('SOCKS5');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedOrderForAssign) return;
    setAssignLoading(true);

    try {
      const expDate = new Date();
      const days = parseFloat(assignExpiryDays) || 1;
      expDate.setTime(expDate.getTime() + days * 24 * 60 * 60 * 1000);

      await adminAssignProxy({
        orderId: selectedOrderForAssign.id,
        userId: selectedOrderForAssign.userId,
        userEmail: selectedOrderForAssign.userEmail,
        host: assignHost,
        port: parseInt(assignPort, 10) || 1080,
        username: assignUser,
        password: assignPass,
        protocol: assignProtocol,
        packageDuration: selectedOrderForAssign.duration,
        expiresAt: expDate.toISOString(),
      });

      setAssignModalOpen(false);
      alert('Proxy credentials assigned and delivered to customer!');
    } catch (e: any) {
      alert('Failed to assign proxy: ' + e.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSaved(false);
    try {
      await adminSaveSettings({
        usdtBep20Address: settingsAddress.trim(),
        minDepositUsdt: parseFloat(settingsMinDeposit) || 0.50,
        supportTelegram: settingsTelegram.trim(),
        noticeBanner: settingsBanner.trim(),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (e: any) {
      alert('Error updating settings: ' + e.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleOpenProductEdit = (prod?: ProductItem) => {
    if (prod) {
      setEditingProduct(prod);
    } else {
      setEditingProduct({
        title: '',
        category: 'proxy_time',
        duration: '1 Hour',
        price: 0.20,
        description: 'High-speed proxy node',
        features: ['SOCKS5 & HTTP', '1 Gbps Speed', 'Zero Logs'],
        active: true,
        stock: 999,
        sortOrder: products.length + 1,
      });
    }
    setProductModalOpen(true);
  };

  const handleOpenSuperProxyPreset = () => {
    setEditingProduct({
      title: 'Super Proxy USA (1 Month)',
      category: 'proxy_super',
      duration: '1 Month',
      durationHours: 720,
      price: 16.00,
      country: 'USA',
      badge: '⚡ VIP Super Node',
      isSuperProxy: true,
      description: 'Dedicated high-speed USA residential/datacenter IP with 99.9% uptime, unmetered bandwidth, and elite anonymity.',
      features: ['Dedicated Clean USA IP', '1 Gbps Dedicated Speed', 'HTTP / SOCKS5 Support', '30 Days Guaranteed Uptime', 'Zero Leaks / DNS Shield'],
      active: true,
      stock: 999,
      sortOrder: products.length + 1,
    });
    setProductModalOpen(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductLoading(true);
    try {
      await adminSaveProduct({
        ...editingProduct,
        price: Number(editingProduct.price) || 0,
      });
      setProductModalOpen(false);
      alert('Product saved successfully!');
    } catch (e: any) {
      alert('Error saving product: ' + e.message);
    } finally {
      setProductLoading(false);
    }
  };

  const handleSendNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifLoading(true);
    try {
      await adminSendNotification(notifTargetUserId || 'all', notifTitle, notifMessage);
      setNotifModalOpen(false);
      setNotifTitle('');
      setNotifMessage('');
      alert('Notification dispatched successfully!');
    } catch (e: any) {
      alert('Error sending notification: ' + e.message);
    } finally {
      setNotifLoading(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q)
    );
  });

  const filteredDeposits = deposits.filter((d) => {
    if (depositFilter === 'all') return true;
    return d.status === depositFilter;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-purple-800/40 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500 text-white uppercase tracking-wider">
                Staff Control
              </span>
              <span className="text-xs text-purple-300 font-mono">
                Admin: {currentUser?.email}
              </span>
            </div>
            <h1 className="text-2xl font-black">Proxy Bazar Admin Dashboard</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setNotifTargetUserId('all');
                setNotifModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Notice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'deposits', label: `Deposits (${pendingDepositsCount} pending)`, icon: Wallet },
          { id: 'orders', label: `Orders (${pendingOrdersCount} pending)`, icon: Clock },
          { id: 'products', label: 'Products & Packages', icon: ShoppingBag },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'settings', label: 'Platform Settings', icon: Sliders },
          { id: 'audit', label: 'Audit Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap mb-2 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Revenue</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {formatUsd(totalRevenue)}
              </div>
              <span className="text-[10px] text-emerald-500 font-bold block mt-1">Gross sales</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Pending Deposits</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1">
                {pendingDepositsCount}
              </div>
              <button
                onClick={() => setActiveTab('deposits')}
                className="text-[10px] text-sky-500 font-bold hover:underline block mt-1"
              >
                Review deposits →
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Pending Orders</span>
              <div className="text-2xl sm:text-3xl font-black text-purple-500 mt-1">
                {pendingOrdersCount}
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-[10px] text-purple-500 font-bold hover:underline block mt-1"
              >
                Assign credentials →
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Registered Users</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {users.length}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Total members</span>
            </div>
          </div>

          {/* Quick Action Alerts */}
          {(pendingDepositsCount > 0 || pendingOrdersCount > 0) && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  You have {pendingDepositsCount} pending deposit(s) and {pendingOrdersCount} order(s) awaiting fulfillment.
                </span>
              </div>
              <div className="flex gap-2">
                {pendingDepositsCount > 0 && (
                  <button
                    onClick={() => setActiveTab('deposits')}
                    className="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-bold"
                  >
                    View Deposits
                  </button>
                )}
                {pendingOrdersCount > 0 && (
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="px-3 py-1 rounded-xl bg-purple-600 text-white text-xs font-bold"
                  >
                    View Orders
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. DEPOSITS TAB */}
      {activeTab === 'deposits' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              USDT (BEP20) Deposit Verifications
            </h3>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDepositFilter(filter)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                    depositFilter === filter
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Tx Hash (BSC)</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No deposits matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredDeposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 pl-2">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {dep.userEmail}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {dep.userFriendlyId || dep.userId}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatUsd(dep.amount)}
                      </td>
                      <td className="py-3 font-mono">
                        <a
                          href={`https://bscscan.com/tx/${dep.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>{dep.txHash.slice(0, 8)}...{dep.txHash.slice(-6)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(dep.createdAt).toLocaleDateString()} {new Date(dep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            dep.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-600'
                              : dep.status === 'pending'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-rose-100 text-rose-600'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        {dep.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveDeposit(dep)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReject(dep)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ORDERS & ASSIGN PROXY TAB */}
      {activeTab === 'orders' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Orders & Proxy Fulfillment
            </h3>
            <div className="flex gap-2">
              {(['all', 'pending', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setOrderFilter(filter)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                    orderFilter === filter
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3 pl-2">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Package</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Paid</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No orders found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 pl-2 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {ord.id}
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {ord.userEmail}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {ord.userFriendlyId || ord.userId}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {ord.productName}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {ord.duration}
                      </td>
                      <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatUsd(ord.amount)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            ord.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        {ord.status === 'pending' ? (
                          <button
                            onClick={() => handleOpenAssignModal(ord)}
                            className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 ml-auto"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Assign Credentials</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-500 font-bold">
                            Credentials Assigned
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PRODUCTS & PACKAGES TAB */}
      {activeTab === 'products' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Product Catalog & Proxy Packages
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage regular proxy durations, Super Proxies, and digital services.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenSuperProxyPreset}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>+ Super Proxy USA ($16)</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenProductEdit()}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => {
              const isSuper = prod.isSuperProxy || prod.category === 'proxy_super';
              return (
              <div
                key={prod.id}
                className={`p-4 rounded-2xl flex flex-col justify-between transition border ${
                  isSuper
                    ? 'bg-gradient-to-b from-purple-900/10 to-slate-50 dark:to-slate-950/70 border-purple-400/50 dark:border-purple-500/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    {isSuper ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                        Super Proxy {prod.country ? `• ${prod.country}` : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        {prod.category}
                      </span>
                    )}
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {formatUsd(prod.price)}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    {prod.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">{prod.duration}</span> • {prod.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      prod.active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {prod.active ? 'Active in Store' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => handleOpenProductEdit(prod)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-500 transition shadow-xs"
                    title="Edit Product / Proxy"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* 5. USER DIRECTORY TAB */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Registered Users Directory ({users.length})
            </h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search user ID, email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3 pl-2">User ID</th>
                  <th className="pb-3">Name & Email</th>
                  <th className="pb-3">Balance</th>
                  <th className="pb-3">Deposited</th>
                  <th className="pb-3">Purchased</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-2 font-mono font-bold text-sky-500">
                      {u.userId}
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {u.displayName}
                      </span>
                      <span className="text-[11px] text-slate-400">{u.email}</span>
                    </td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {formatUsd(u.balance)}
                    </td>
                    <td className="py-3 text-emerald-600 font-semibold">
                      {formatUsd(u.totalDeposited)}
                    </td>
                    <td className="py-3 text-purple-600 font-semibold">
                      {formatUsd(u.totalPurchased)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setNotifTargetUserId(u.uid);
                            setNotifModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-sky-500 text-slate-600 dark:text-slate-400"
                          title="Send Notification"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            const next = u.status === 'active' ? 'suspended' : 'active';
                            if (window.confirm(`Are you sure you want to ${next} user ${u.email}?`)) {
                              await adminToggleUserStatus(u.uid, next);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-800">
            Platform Gateway & Deposit Configuration
          </h3>

          {settingsSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Platform settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                USDT BEP20 Deposit Address (BSC)
              </label>
              <input
                type="text"
                required
                value={settingsAddress}
                onChange={(e) => setSettingsAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Deposit Threshold (USDT)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={settingsMinDeposit}
                onChange={(e) => setSettingsMinDeposit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Support Telegram Handle or URL
              </label>
              <input
                type="text"
                required
                value={settingsTelegram}
                onChange={(e) => setSettingsTelegram(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Global Header Notice Banner
              </label>
              <textarea
                rows={3}
                value={settingsBanner}
                onChange={(e) => setSettingsBanner(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <button
              type="submit"
              disabled={settingsLoading}
              className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* 7. AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            System & Security Audit Logs
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
            {auditLogs.length === 0 ? (
              <p className="py-6 text-slate-400 text-center font-sans">No audit events recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      [{log.action}]
                    </span>{' '}
                    <span className="text-slate-700 dark:text-slate-300">
                      Target: {log.targetType} ({log.targetId})
                    </span>
                    {log.details && (
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5 truncate max-w-lg">
                        {log.details}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400 shrink-0 font-sans">
                    <span>{log.adminEmail}</span> • {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ASSIGN PROXY MODAL */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Proxy Credentials to Customer"
        maxWidth="md"
      >
        {selectedOrderForAssign && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmAssign();
            }}
            className="space-y-4 text-xs"
          >
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50">
              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">
                Target Order
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {selectedOrderForAssign.productName} ({selectedOrderForAssign.duration})
              </p>
              <p className="text-[11px] text-slate-500">Customer: {selectedOrderForAssign.userEmail}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Host / IP</label>
                <input
                  type="text"
                  required
                  value={assignHost}
                  onChange={(e) => setAssignHost(e.target.value)}
                  placeholder="e.g. 194.26.29.14"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Port</label>
                <input
                  type="number"
                  required
                  value={assignPort}
                  onChange={(e) => setAssignPort(e.target.value)}
                  placeholder="1080"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={assignPass}
                  onChange={(e) => setAssignPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Protocol</label>
                <select
                  value={assignProtocol}
                  onChange={(e) => setAssignProtocol(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                >
                  <option value="SOCKS5">SOCKS5</option>
                  <option value="HTTP">HTTP</option>
                  <option value="HTTPS">HTTPS</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Duration Validity (Days)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={assignExpiryDays}
                  onChange={(e) => setAssignExpiryDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignLoading}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                {assignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Deliver'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* REJECT DEPOSIT MODAL */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Deposit Request"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Specify the reason for rejecting this deposit. The user will be notified immediately.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={actionLoading}
              className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>

      {/* PRODUCT EDIT MODAL */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct.id ? 'Edit Product / Package' : 'Create New Product / Super Proxy'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Title / Package Name</label>
            <input
              type="text"
              required
              value={editingProduct.title || ''}
              onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
              placeholder="e.g. Super Proxy USA (1 Month) or 3 Hours Standard"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Category</label>
              <select
                value={editingProduct.category || 'proxy_time'}
                onChange={(e) => {
                  const cat = e.target.value as any;
                  setEditingProduct({
                    ...editingProduct,
                    category: cat,
                    isSuperProxy: cat === 'proxy_super' ? true : editingProduct.isSuperProxy,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold"
              >
                <option value="proxy_time">Time-based Package (Hourly / Daily)</option>
                <option value="proxy_super">⚡ Super Proxy (Dedicated Monthly / USA)</option>
                <option value="proxy_residential">Residential Proxy (Rotating GB)</option>
                <option value="proxy_datacenter">Datacenter Proxy (Dedicated IPv4)</option>
                <option value="proxy_isp">Static ISP Clean Pool</option>
                <option value="digital_service">Digital API Service</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Price (USD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={editingProduct.price ?? 0}
                onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Duration Label</label>
              <input
                type="text"
                required
                value={editingProduct.duration || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, duration: e.target.value })}
                placeholder="e.g. 1 Month, 5 Hours, 30 Days"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Country / Region</label>
              <input
                type="text"
                value={editingProduct.country || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, country: e.target.value })}
                placeholder="e.g. USA, UK, Global"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Badge (Optional)</label>
              <input
                type="text"
                value={editingProduct.badge || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                placeholder="e.g. ⚡ Super Proxy USA or Best Value"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Status</label>
              <select
                value={editingProduct.active ? 'true' : 'false'}
                onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.value === 'true' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold"
              >
                <option value="true">Active & Visible in Marketplace</option>
                <option value="false">Disabled / Hidden</option>
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.isSuperProxy || editingProduct.category === 'proxy_super'}
                onChange={(e) => setEditingProduct({ ...editingProduct, isSuperProxy: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="font-bold text-purple-700 dark:text-purple-300">
                ⚡ Mark as Super Proxy (Featured with VIP Badge & Highlighted Card)
              </span>
            </label>
          </div>

          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              value={editingProduct.description || ''}
              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
              placeholder="Package details..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setProductModalOpen(false)}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={productLoading}
              className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {productLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* NOTIFICATION DISPATCH MODAL */}
      <Modal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        title="Dispatch Notification"
        maxWidth="sm"
      >
        <form onSubmit={handleSendNotificationSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Target</label>
            <input
              type="text"
              disabled
              value={notifTargetUserId === 'all' ? 'All Registered Users (Broadcast)' : `User UID: ${notifTargetUserId}`}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Title</label>
            <input
              type="text"
              required
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="e.g. Maintenance Announcement"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Message</label>
            <textarea
              rows={3}
              required
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Message contents..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNotifModalOpen(false)}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={notifLoading}
              className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-bold"
            >
              {notifLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Now'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
