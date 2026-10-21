import React from 'react';
import { Home, Shield, ShoppingBag, Wallet, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { isAdmin, language } = useAuth();
  const t = getT(language);

  const items = [
    { id: 'dashboard', label: t.navHome, icon: Home },
    { id: 'proxies', label: t.navProxyBuy, icon: Shield },
    { id: 'products', label: t.navProducts, icon: ShoppingBag },
    { id: 'deposit', label: t.navDeposit, icon: Wallet },
    { id: isAdmin ? 'admin' : 'profile', label: isAdmin ? 'Admin' : t.navProfile, icon: isAdmin ? Settings : UserIcon },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 py-1.5 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center py-1 relative select-none transition-transform active:scale-90"
            >
              <div
                className={`relative p-1.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 -translate-y-1'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium tracking-tight truncate max-w-[64px] ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
