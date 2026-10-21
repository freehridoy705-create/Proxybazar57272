import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { AuthModal } from './components/auth/AuthModal';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { ProxyBuyPage } from './components/proxies/ProxyBuyPage';
import { DigitalProductsPage } from './components/products/DigitalProductsPage';
import { DepositPage } from './components/deposits/DepositPage';
import { OrderHistoryPage } from './components/history/OrderHistoryPage';
import { TransactionHistoryPage } from './components/history/TransactionHistoryPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Send, Shield, Loader2 } from 'lucide-react';
import { Logo } from './components/common/Logo';

const MainApp: React.FC = () => {
  const { loading, settings } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <Logo size="lg" />
        <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connecting to Proxy Bazar Gateway...</span>
        </div>
      </div>
    );
  }

  const telegramLink = settings?.supportTelegram || 'https://t.me/Proxy_bazar_c';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && <UserDashboard onNavigate={setActiveTab} />}
        {activeTab === 'proxies' && <ProxyBuyPage onNavigate={setActiveTab} />}
        {activeTab === 'products' && <DigitalProductsPage onNavigate={setActiveTab} />}
        {activeTab === 'deposit' && <DepositPage />}
        {activeTab === 'orders' && <OrderHistoryPage />}
        {activeTab === 'transactions' && <TransactionHistoryPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating Telegram Support Quick Action */}
      <a
        href={telegramLink}
        target="_blank"
        rel="noreferrer"
        className="hidden sm:flex fixed bottom-6 right-6 z-30 items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 transition duration-300 group"
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <Send className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        </div>
        <span>Telegram Support</span>
      </a>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-8 mb-16 lg:mb-0 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={false} />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Proxy Bazar • The Premier Proxy & Digital Goods Marketplace
              </p>
              <p className="text-[11px] text-slate-400">
                High Speed SOCKS5/HTTP • Instant BEP20 USDT Deposits • 24/7 Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href={telegramLink}
              target="_blank"
              rel="noreferrer"
              className="hover:text-sky-500 transition font-semibold"
            >
              Telegram: @Proxy_bazar_c
            </a>
            <span>•</span>
            <button
              onClick={() => setActiveTab('proxies')}
              className="hover:text-sky-500 transition"
            >
              Pricing
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('deposit')}
              className="hover:text-sky-500 transition"
            >
              Deposit
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Dock Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
