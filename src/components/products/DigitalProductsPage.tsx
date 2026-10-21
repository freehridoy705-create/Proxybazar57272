import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Zap,
  Check,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Filter,
  Layers,
  Database,
  Radio,
  Key,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { getT } from '../../utils/translations';
import { formatUsd, generateIdempotencyKey } from '../../utils/idGenerator';
import { ProductItem, ProductCategory } from '../../types';
import { purchaseProduct } from '../../services/api';
import { Modal } from '../common/Modal';
import { DEFAULT_DIGITAL_PRODUCTS } from '../../services/seedData';

interface DigitalProductsPageProps {
  onNavigate: (tab: string) => void;
}

export const DigitalProductsPage: React.FC<DigitalProductsPageProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, openAuthModal, language } = useAuth();
  const t = getT(language);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('category', '!=', 'proxy_time'));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const list: ProductItem[] = [];
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ProductItem));
        setProducts(list.filter((p) => p.active));
      } else {
        setProducts(DEFAULT_DIGITAL_PRODUCTS.map((p, i) => ({ ...p, id: `dig-${i}` })));
      }
      setLoading(false);
    }, (err) => {
      console.warn('Digital products note:', err);
      setProducts(DEFAULT_DIGITAL_PRODUCTS.map((p, i) => ({ ...p, id: `dig-${i}` })));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleOpenBuyModal = (prod: ProductItem) => {
    if (!currentUser) {
      openAuthModal('signin');
      return;
    }
    setSelectedProduct(prod);
    setPurchaseError(null);
    setPurchaseSuccess(null);
    setModalOpen(true);
  };

  const handleConfirmBuy = async () => {
    if (!selectedProduct || !currentUser) return;

    const userBal = Number(userProfile?.balance || 0);
    if (userBal < selectedProduct.price) {
      setPurchaseError(t.insufficientBalance);
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      const res = await purchaseProduct({
        productId: selectedProduct.id,
        productName: selectedProduct.title,
        category: selectedProduct.category,
        duration: selectedProduct.duration,
        price: selectedProduct.price,
        idempotencyKey: generateIdempotencyKey(),
      });

      if (res.success) {
        setPurchaseSuccess(t.purchaseSuccess);
        setConfirmedOrderId(res.orderId);
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      if (err.message === 'INSUFFICIENT_BALANCE') {
        setPurchaseError(t.insufficientBalance);
      } else {
        setPurchaseError(err.message || 'Error executing purchase');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  const getCategoryIcon = (cat: ProductCategory) => {
    switch (cat) {
      case 'proxy_residential':
        return <Layers className="w-4 h-4 text-sky-500" />;
      case 'proxy_datacenter':
        return <Database className="w-4 h-4 text-purple-500" />;
      case 'proxy_isp':
        return <Radio className="w-4 h-4 text-emerald-500" />;
      default:
        return <Key className="w-4 h-4 text-amber-500" />;
    }
  };

  const currentBal = Number(userProfile?.balance || 0);
  const isBalanceEnough = selectedProduct ? currentBal >= selectedProduct.price : false;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-bold mb-3 border border-white/20">
            <ShoppingBag className="w-3.5 h-3.5 text-pink-300" />
            <span>Authorized Digital Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            {t.digitalProductsTitle}
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
            {t.digitalProductsSubtitle}
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            categoryFilter === 'all'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          All Digital Products ({products.length})
        </button>
        <button
          onClick={() => setCategoryFilter('proxy_residential')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            categoryFilter === 'proxy_residential'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          Residential Proxies
        </button>
        <button
          onClick={() => setCategoryFilter('proxy_datacenter')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            categoryFilter === 'proxy_datacenter'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          Datacenter Proxies
        </button>
        <button
          onClick={() => setCategoryFilter('proxy_isp')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            categoryFilter === 'proxy_isp'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          Static ISP Clean Pools
        </button>
        <button
          onClick={() => setCategoryFilter('digital_service')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            categoryFilter === 'digital_service'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          API Gateways & Scraping
        </button>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-xl hover:border-purple-500/40 transition duration-300 relative group"
            >
              {prod.badge && (
                <div className="absolute top-5 right-5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                    {prod.badge}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400">
                  {getCategoryIcon(prod.category)}
                  <span className="capitalize">{prod.category.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{prod.duration}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {language === 'bn' && prod.titleBn ? prod.titleBn : prod.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  {language === 'bn' && prod.descriptionBn ? prod.descriptionBn : prod.description}
                </p>

                {/* Features */}
                <div className="space-y-1.5 mb-6 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  {(language === 'bn' && prod.featuresBn ? prod.featuresBn : prod.features).map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatUsd(prod.price)}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1">/ {prod.duration}</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {t.inStock}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenBuyModal(prod)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>{t.buyNow}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (!purchasing) setModalOpen(false);
        }}
        title={t.confirmPurchase}
        maxWidth="md"
      >
        {selectedProduct && (
          <div className="space-y-5">
            {purchaseSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Order Submitted!
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
                      setModalOpen(false);
                      onNavigate('orders');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md"
                  >
                    View My Orders
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-start pb-3 border-b border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">Product</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {selectedProduct.title}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">Validity</span>
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {selectedProduct.duration}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Item Price:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatUsd(selectedProduct.price)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Your Balance:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatUsd(currentBal)}
                      </span>
                    </div>

                    <div className="border-t border-slate-200/60 dark:border-slate-800 pt-2 flex justify-between font-bold">
                      <span>Remaining Balance:</span>
                      <span className={isBalanceEnough ? 'text-emerald-500' : 'text-rose-500'}>
                        {isBalanceEnough
                          ? formatUsd(currentBal - selectedProduct.price)
                          : 'Insufficient Balance'}
                      </span>
                    </div>
                  </div>
                </div>

                {purchaseError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{purchaseError}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={purchasing}
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>

                  {isBalanceEnough ? (
                    <button
                      type="button"
                      disabled={purchasing}
                      onClick={handleConfirmBuy}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
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
                        setModalOpen(false);
                        onNavigate('deposit');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition"
                    >
                      Deposit USDT First
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
