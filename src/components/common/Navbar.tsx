import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Globe,
  Wallet,
  User as UserIcon,
  LogOut,
  Shield,
  Layers,
  ShoppingBag,
  History,
  Menu,
  X,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';
import { formatUsd } from '../../utils/idGenerator';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    userProfile,
    isAdmin,
    language,
    setLanguage,
    theme,
    toggleTheme,
    openAuthModal,
    logout,
  } = useAuth();

  const t = getT(language);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t.navHome, icon: Layers },
    { id: 'proxies', label: t.navProxyBuy, icon: Shield },
    { id: 'products', label: t.navProducts, icon: ShoppingBag },
    { id: 'deposit', label: t.navDeposit, icon: Wallet },
    { id: 'orders', label: t.navOrders, icon: Layers },
    { id: 'transactions', label: t.navTransactions, icon: History },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: t.navAdmin, icon: Shield });
  }

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => handleTabClick('dashboard')}
          className="cursor-pointer transition transform active:scale-95"
        >
          <Logo size="md" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400 font-bold border border-sky-500/20 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                } ${item.id === 'admin' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {item.id === 'admin' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 uppercase font-black">
                    Staff
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span className="font-semibold">{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* User Section */}
          {currentUser ? (
            <>
              {/* Balance Pill */}
              <button
                onClick={() => handleTabClick('deposit')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 hover:border-sky-500/40 transition group"
                title="Deposit USDT"
              >
                <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  $
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block -mb-1 font-medium">Balance</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition">
                    {formatUsd(userProfile?.balance || 0)}
                  </span>
                </div>
                <PlusCircle className="w-3.5 h-3.5 text-sky-500 group-hover:rotate-90 transition-transform" />
              </button>

              {/* Notification Bell */}
              <NotificationBell onNavigate={handleTabClick} />

              {/* User Avatar & Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex flex-col text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-900 dark:text-white max-w-[100px] truncate">
                      {userProfile?.displayName || 'User'}
                    </span>
                    <span className="text-[10px] text-sky-500 font-mono font-bold">
                      {userProfile?.userId || 'PB-ID'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>

                {/* Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {userProfile?.displayName || 'Member'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          {userProfile?.userId}
                        </span>
                        {isAdmin && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => handleTabClick('profile')}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        {t.actionProfile}
                      </button>

                      <button
                        onClick={() => handleTabClick('deposit')}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                      >
                        <Wallet className="w-4 h-4 text-sky-500" />
                        {t.actionDeposit}
                      </button>

                      <button
                        onClick={() => handleTabClick('orders')}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                      >
                        <Layers className="w-4 h-4 text-indigo-500" />
                        {t.orderHistory}
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleTabClick('admin')}
                          className="w-full px-4 py-2 text-left text-xs text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center gap-2.5"
                        >
                          <Shield className="w-4 h-4 text-purple-500" />
                          {t.navAdmin}
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5"
                      >
                        <LogOut className="w-4 h-4" />
                        {t.signOut}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-500 transition"
              >
                {t.signIn}
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 transition"
              >
                {t.signUp}
              </button>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-1 shadow-2xl">
          {currentUser && (
            <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-indigo-500/10 border border-sky-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Available Funds</span>
                <span className="text-lg font-black text-sky-600 dark:text-sky-400">
                  {formatUsd(userProfile?.balance || 0)}
                </span>
              </div>
              <button
                onClick={() => handleTabClick('deposit')}
                className="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-sm"
              >
                + Deposit
              </button>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-sky-500" />
                  <span>{item.label}</span>
                </div>
                {item.id === 'admin' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300">
                    Admin
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <a
              href="https://t.me/Proxy_bazar_c"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-sky-600 dark:text-sky-400 font-semibold hover:bg-sky-50 dark:hover:bg-sky-950/30"
            >
              <span>Telegram Support @Proxy_bazar_c</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
