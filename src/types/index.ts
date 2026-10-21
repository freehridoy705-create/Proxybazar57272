export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  userId: string; // e.g. PB-10492
  email: string;
  displayName: string;
  role: UserRole;
  balance: number; // in USD
  totalDeposited: number;
  totalPurchased: number;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export type ProductCategory = 
  | 'proxy_time' 
  | 'proxy_super'
  | 'proxy_residential' 
  | 'proxy_datacenter' 
  | 'proxy_isp' 
  | 'digital_service';

export interface ProductItem {
  id: string;
  title: string;
  titleBn?: string;
  category: ProductCategory;
  duration: string; // e.g. "1.5 Hours", "3 Hours", "1 Day", "1 Month"
  durationHours?: number;
  country?: string; // e.g. "USA", "UK", "Global"
  isSuperProxy?: boolean;
  price: number;
  description: string;
  descriptionBn?: string;
  features: string[];
  featuresBn?: string[];
  active: boolean;
  stock?: number;
  popular?: boolean;
  badge?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt?: string;
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  userId: string;
  userEmail: string;
  userFriendlyId?: string;
  productId: string;
  productName: string;
  category: string;
  duration: string;
  amount: number;
  status: OrderStatus;
  idempotencyKey: string;
  proxyAssignmentId?: string;
  createdAt: string;
  assignedAt?: string;
  notes?: string;
}

export type DepositStatus = 'pending' | 'approved' | 'rejected';
export type BlockchainNetwork = 'USDT_BEP20';

export interface DepositItem {
  id: string;
  userId: string;
  userEmail: string;
  userFriendlyId?: string;
  amount: number;
  network: BlockchainNetwork;
  txHash: string;
  depositAddress: string;
  status: DepositStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type TransactionType = 'deposit' | 'purchase' | 'refund' | 'adjustment';

export interface TransactionItem {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string; // orderId or depositId
  description: string;
  createdAt: string;
}

export type ProxyProtocol = 'HTTP' | 'HTTPS' | 'SOCKS5';
export type ProxyStatus = 'active' | 'expired' | 'revoked';

export interface ProxyAssignment {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: ProxyProtocol;
  packageDuration: string;
  purchaseDate: string;
  expiresAt: string;
  status: ProxyStatus;
  notes?: string;
  createdAt: string;
}

export type NotificationType = 'order' | 'deposit' | 'proxy' | 'system';

export interface NotificationItem {
  id: string;
  userId: string; // specific user UID or 'all'
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PlatformSettings {
  usdtBep20Address: string;
  minDepositUsdt: number;
  supportTelegram: string;
  noticeBanner?: string;
  noticeBannerBn?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuditLogItem {
  id: string;
  adminEmail: string;
  adminUid: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  createdAt: string;
}

export type Language = 'en' | 'bn';
export type Theme = 'dark' | 'light';
