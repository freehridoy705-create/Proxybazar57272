import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ProductItem, PlatformSettings } from '../types';

export const DEFAULT_PROXY_PACKAGES: Omit<ProductItem, 'id'>[] = [
  {
    title: '1.5 Hours Turbo Proxy',
    titleBn: '১.৫ ঘন্টা টার্বো প্রক্সি',
    category: 'proxy_time',
    duration: '1.5 Hours',
    durationHours: 1.5,
    price: 0.15,
    description: 'High-speed dedicated private proxy for quick sessions, surveys, and browsing.',
    descriptionBn: 'দ্রুত গতির প্রাইভেট প্রক্সি স্বল্পমেয়াদী কাজ এবং ব্রাউজিংয়ের জন্য।',
    features: ['SOCKS5 & HTTP/S', '1 Gbps Port Speed', 'No Bandwidth Limits', 'Zero Logs Guaranteed'],
    featuresBn: ['সক্স৫ ও এইচটিটিপি/এস', '১ জিবিপিএস পোর্ট স্পিড', 'আনলিমিটেড ব্যান্ডউইথ', 'জিরো লগ পলিসি'],
    active: true,
    stock: 999,
    popular: false,
    badge: 'Quick Trial',
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    title: '3 Hours Standard Proxy',
    titleBn: '৩ ঘন্টা স্ট্যান্ডার্ড প্রক্সি',
    category: 'proxy_time',
    duration: '3 Hours',
    durationHours: 3,
    price: 0.30,
    description: 'Stable proxy session with premium speed and IP protection.',
    descriptionBn: 'স্থিতিশীল ৩ ঘন্টার প্রক্সি সেশন সর্বোচ্চ গতি ও আইপি সুরক্ষাসহ।',
    features: ['Pure Residential Node', '99.9% Uptime', 'Low Latency Ping', 'Instant Activation'],
    featuresBn: ['রেসিডেনশিয়াল নোড', '৯৯.৯% আপটাইম', 'কম ল্যাটেন্সি পিং', 'দ্রুত সক্রিয়করণ'],
    active: true,
    stock: 999,
    popular: false,
    badge: 'Popular',
    sortOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    title: '5 Hours Pro Proxy',
    titleBn: '৫ ঘন্টা প্রো প্রক্সি',
    category: 'proxy_time',
    duration: '5 Hours',
    durationHours: 5,
    price: 0.50,
    description: 'Extended proxy work session ideal for automation, social media, and research.',
    descriptionBn: 'অটোমেশন এবং গবেষণার কাজের জন্য উপযুক্ত দীর্ঘমেয়াদী ৫ ঘন্টার প্রক্সি।',
    features: ['High Concurrency Support', 'Dual Auth (IP/User:Pass)', 'Global Location Choice', 'Clean Subnet Pool'],
    featuresBn: ['উচ্চ ট্রাফিক সাপোর্ট', 'ডুয়েল অথেনটিকেশন', 'গ্লোবাল লোকেশন চয়েস', 'ক্লিন সাবনেট পুল'],
    active: true,
    stock: 999,
    popular: true,
    badge: 'Best Value',
    sortOrder: 3,
    createdAt: new Date().toISOString(),
  },
  {
    title: '10 Hours Super Proxy',
    titleBn: '১০ ঘন্টা সুপার প্রক্সি',
    category: 'proxy_time',
    duration: '10 Hours',
    durationHours: 10,
    price: 0.70,
    description: 'All-day working proxy session for professional web workflows and multi-accounts.',
    descriptionBn: 'প্রফেশনাল কাজের জন্য সারাদিনের উপযোগী হাই-স্পিড ১০ ঘন্টার প্রক্সি।',
    features: ['Dedicated Bandwidth Channel', 'Unmetered Traffic', 'Instant Proxy Swap', 'Priority Server Routing'],
    featuresBn: ['ডেডিকেটেড ব্যান্ডউইথ চ্যানেল', 'আনমিটারড ট্রাফিক', 'ইনস্ট্যান্ট প্রক্সি সোয়াপ', 'অগ্রাধিকার রাউটিং'],
    active: true,
    stock: 999,
    popular: false,
    badge: 'Top Tier',
    sortOrder: 4,
    createdAt: new Date().toISOString(),
  },
  {
    title: '1 Day Full Access Proxy',
    titleBn: '১ দিন ফুল এক্সেস প্রক্সি',
    category: 'proxy_time',
    duration: '1 Day',
    durationHours: 24,
    price: 1.00,
    description: '24 hours complete uninterrupted high speed proxy access with premium quality IPs.',
    descriptionBn: '২৪ ঘণ্টার সম্পূর্ণ নিরবচ্ছিন্ন হাই স্পিড প্রক্সি অ্যাক্সেস প্রিমিয়াম কোয়ালিটি আইপিসহ।',
    features: ['24-Hour Continuous Uptime', 'Elite Anonymity Level', 'Works with all tools/browsers', 'VIP Telegram Support'],
    featuresBn: ['২৪ ঘন্টা অবিরাম আপটাইম', 'এলিট বেনামী সুরক্ষা', 'সব ব্রাউজার ও টুলে কার্যকর', 'ভিআইপি টেলিগ্রাম সাপোর্ট'],
    active: true,
    stock: 999,
    popular: true,
    badge: 'Max Savings',
    sortOrder: 5,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Super Proxy USA (1 Month)',
    titleBn: 'সুপার প্রক্সি ইউএসএ (১ মাস)',
    category: 'proxy_super',
    duration: '1 Month',
    durationHours: 720,
    country: 'USA',
    isSuperProxy: true,
    price: 16.00,
    description: 'Elite dedicated USA residential & ISP private proxy for 1 full month. High-speed 10 Gbps unmetered throughput.',
    descriptionBn: '১ মাসের জন্য এলিট ডেডিকেটেড ইউএসএ প্রাইভেট প্রক্সি। হাই-স্পিড ১০ জিবিপিএস আনমিটারড ব্যান্ডউইথ।',
    features: [
      '🇺🇸 Dedicated USA Clean IP Pool',
      '1 Month (30 Days) Full Access',
      '10 Gbps Port Speed Unmetered',
      'HTTP/S & SOCKS5 Dual Auth',
      'VIP Dedicated Priority Support',
    ],
    featuresBn: [
      '🇺🇸 ডেডিকেটেড ইউএসএ ক্লিন আইপি',
      '১ মাস (৩০ দিন) ফুল এক্সেস',
      '১০ জিবিপিএস পোর্ট আনমিটারড',
      'এইচটিটিপি ও সক্স৫ ডুয়েল অথ',
      'ভিআইপি প্রায়োরিটি সাপোর্ট',
    ],
    active: true,
    stock: 500,
    popular: true,
    badge: '⚡ Super Proxy USA',
    sortOrder: 6,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_DIGITAL_PRODUCTS: Omit<ProductItem, 'id'>[] = [
  {
    title: 'SOCKS5 Rotating Residential Proxy (1 GB)',
    titleBn: 'সক্স৫ রোটেটিং রেসিডেনশিয়াল প্রক্সি (১ জিবি)',
    category: 'proxy_residential',
    duration: '30 Days Validity',
    price: 2.50,
    description: 'Dynamic IP rotation on every request or 10-minute sticky session. Real residential ISPs.',
    descriptionBn: 'প্রতি রিকোয়েস্টে নতুন আইপি অথবা ১০ মিনিট স্টিকি সেশন। রিয়েল রেসিডেনশিয়াল আইএসপি।',
    features: ['90M+ Global Residential IPs', 'Geo-targeting by Country/City', 'Automatic IP Rotation', 'HTTP/S & SOCKS5'],
    featuresBn: ['৯০ মিলিয়ন+ গ্লোবাল আইপি', 'দেশ ও শহর সিলেক্ট করার সুবিধা', 'স্বয়ংক্রিয় আইপি রোটেশন', 'এইচটিটিপি ও সক্স৫'],
    active: true,
    stock: 250,
    popular: true,
    badge: 'Hot Seller',
    sortOrder: 6,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Dedicated USA Datacenter IPv4 Proxy (30 Days)',
    titleBn: 'ডেডিকেটেড ইউএসএ ডেটাসেন্টার IPv4 প্রক্সি (৩০ দিন)',
    category: 'proxy_datacenter',
    duration: '30 Days',
    price: 3.20,
    description: 'Static private IPv4 address exclusive to you. Blazing fast 10 Gbps unmetered throughput.',
    descriptionBn: 'শুধুমাত্র আপনার জন্য নির্ধারিত স্ট্যাটিক প্রাইভেট IPv4 এড্রেস। দ্রুতগতির ১০ জিবিপিএস ব্যান্ডউইথ।',
    features: ['Static Dedicated IP', '10 Gbps Unmetered Port', 'Subnet Diversity', '99.99% Guaranteed SLA'],
    featuresBn: ['স্ট্যাটিক ডেডিকেটেড আইপি', '১০ জিবিপিএস পোর্ট', 'সাবনেট ভিন্নতা', '৯৯.৯৯% এসএলএ গ্যারান্টি'],
    active: true,
    stock: 120,
    popular: false,
    badge: 'Dedicated IP',
    sortOrder: 7,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Static ISP Residential Proxy - Clean Pool (7 Days)',
    titleBn: 'স্ট্যাটিক আইএসপি রেসিডেনশিয়াল প্রক্সি (৭ দিন)',
    category: 'proxy_isp',
    duration: '7 Days',
    price: 4.00,
    description: 'Legitimate ISP-assigned fixed residential IP. Highest trust score for sensitive operations.',
    descriptionBn: 'রিয়েল আইএসপি প্রদত্ত ফিক্সড রেসিডেনশিয়াল আইপি। সর্বোচ্চ ট্রাস্ট স্কোরযুক্ত।',
    features: ['AT&T / Verizon / Comcast ISP Pools', 'High Fraud Score Resistance', 'Fixed Static IP for 7 Days', 'Dual Authentication'],
    featuresBn: ['টপ ইউএসএ আইএসপি পুল', 'হাই ট্রাস্ট স্কোর', '৭ দিন স্থায়ী ফিক্সড আইপি', 'সহজ কনফিগারেশন'],
    active: true,
    stock: 45,
    popular: true,
    badge: 'Clean Pool',
    sortOrder: 8,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Mobile 4G/5G Proxy Gateway (24 Hours)',
    titleBn: 'মোবাইল ৪জি/৫জি প্রক্সি গেটওয়ে (২৪ ঘন্টা)',
    category: 'proxy_residential',
    duration: '24 Hours',
    price: 2.90,
    description: 'Real mobile SIM card data connection with automatic or link-triggered IP rotation.',
    descriptionBn: 'প্রকৃত মোবাইল সিম সংযোগভিত্তিক ৪জি/৫জি প্রক্সি। ইনস্ট্যান্ট আইপি চেঞ্জ লিঙ্কসহ।',
    features: ['Real Mobile Carrier Subnets', 'One-Click IP Reset API', 'Zero Captcha Experience', 'Unlimited Bandwidth'],
    featuresBn: ['মোবাইল নেটওয়ার্ক সাবনেট', 'এক ক্লিকে আইপি রিসেট', 'জিরো ক্যাপচা রেট', 'আনলিমিটেড ব্যান্ডউইথ'],
    active: true,
    stock: 30,
    popular: false,
    badge: 'Mobile 4G/5G',
    sortOrder: 9,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Web Scraping API Proxy Token (10,000 Requests)',
    titleBn: 'ওয়েব স্ক্র্যাপিং এপিআই প্রক্সি টোকেন (১০,০০০ রিকোয়েস্ট)',
    category: 'digital_service',
    duration: 'No Expiry',
    price: 1.80,
    description: 'Cloud API token with automatic proxy rotation, Javascript rendering, and anti-bot bypass.',
    descriptionBn: 'ক্লাউড এপিআই টোকেন যাতে অটোমেটিক প্রক্সি রোটেশন ও অ্যান্টি-বট বাইপাস সমন্বিত।',
    features: ['JavaScript Headless Rendering', 'Automatic Cloudflare Bypass', 'JSON/HTML Output Format', 'Permanent Token Balance'],
    featuresBn: ['জাভাস্ক্রিপ্ট রেন্ডারিং সাপোর্ট', 'ক্লাউডফ্লেয়ার বাইপাস', 'জেসন/এইচটিএমএল আউটপুট', 'মেয়াদবিহীন টোকেন ব্যালেন্স'],
    active: true,
    stock: 500,
    popular: false,
    badge: 'API Token',
    sortOrder: 10,
    createdAt: new Date().toISOString(),
  },
];

export async function ensureInitialDatabaseSeeded(): Promise<void> {
  try {
    // 1. Settings check
    const settingsRef = doc(db, 'settings', 'main');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      const defaultSettings: PlatformSettings = {
        usdtBep20Address: '0x88e7A26d03f0b2fB144FE8d37452d7eC1dE126e8',
        minDepositUsdt: 0.50,
        supportTelegram: 'https://t.me/Proxy_bazar_c',
        noticeBanner: '🚀 Welcome to Proxy Bazar! Ultra-fast time-based and residential proxies with instant setup. Support: @Proxy_bazar_c',
        noticeBannerBn: '🚀 প্রক্সি বাজারে স্বাগতম! দ্রুতগতির প্রাইভেট প্রক্সি এবং ইনস্ট্যান্ট সার্ভিস। টেলিগ্রাম সাপোর্ট: @Proxy_bazar_c',
        updatedAt: new Date().toISOString(),
      };
      await setDoc(settingsRef, defaultSettings);
    }

    // 2. Products check
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      const batch = writeBatch(db);
      const allToSeed = [...DEFAULT_PROXY_PACKAGES, ...DEFAULT_DIGITAL_PRODUCTS];
      allToSeed.forEach((prod, index) => {
        const prodRef = doc(collection(db, 'products'));
        batch.set(prodRef, {
          ...prod,
          id: prodRef.id,
        });
      });
      await batch.commit();
      console.log('Seeded initial products and proxy packages successfully.');
    } else {
      // If products already exist, check if Super Proxy package is present
      const superProxyDoc = productsSnap.docs.find((d) => d.data().category === 'proxy_super' || d.data().isSuperProxy);
      if (!superProxyDoc) {
        const superPackage = DEFAULT_PROXY_PACKAGES.find((p) => p.category === 'proxy_super');
        if (superPackage) {
          const newDoc = doc(collection(db, 'products'));
          await setDoc(newDoc, {
            ...superPackage,
            id: newDoc.id,
          });
          console.log('Added Super Proxy USA to existing catalog.');
        }
      }
    }
  } catch (err) {
    console.warn('Seed database initialization note (harmless if rules restricted or already initialized):', err);
  }
}
