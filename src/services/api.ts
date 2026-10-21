import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  writeBatch,
  addDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth, isConfiguredAdmin, OperationType, handleFirestoreError } from '../firebase/config';
import {
  OrderItem,
  DepositItem,
  TransactionItem,
  ProxyAssignment,
  NotificationItem,
  PlatformSettings,
  AuditLogItem,
  ProductItem,
  UserProfile,
} from '../types';
import { generateOrderId, generateDepositId, generateIdempotencyKey } from '../utils/idGenerator';

export interface PurchaseParams {
  productId: string;
  productName: string;
  category: string;
  duration: string;
  price: number;
  idempotencyKey?: string;
}

export interface PurchaseResult {
  success: boolean;
  orderId: string;
  message?: string;
  remainingBalance: number;
}

/**
 * ATOMIC BALANCE DEDUCTION & IDEMPOTENT ORDER CREATION
 * Prevents race conditions, double clicks, and negative balances.
 */
export async function purchaseProduct(params: PurchaseParams): Promise<PurchaseResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required. Please sign in to purchase.');
  }

  const uid = currentUser.uid;
  const userRef = doc(db, 'users', uid);
  const orderId = generateOrderId();
  const orderRef = doc(db, 'orders', orderId);
  const txRef = doc(collection(db, 'transactions'));
  const notifRef = doc(collection(db, 'notifications'));
  const key = params.idempotencyKey || generateIdempotencyKey();

  // First, check idempotency: does an order with this key already exist?
  try {
    const existingOrdersQ = query(
      collection(db, 'orders'),
      where('userId', '==', uid),
      where('idempotencyKey', '==', key)
    );
    const existingOrdersSnap = await getDocs(existingOrdersQ);
    if (!existingOrdersSnap.empty) {
      const existingOrder = existingOrdersSnap.docs[0].data() as OrderItem;
      const userSnap = await getDoc(userRef);
      const userBal = userSnap.exists() ? (userSnap.data() as UserProfile).balance : 0;
      return {
        success: true,
        orderId: existingOrder.id,
        message: 'Order already processed (idempotent)',
        remainingBalance: userBal,
      };
    }
  } catch (err) {
    console.warn('Idempotency check query note:', err);
  }

  // Execute Atomic Transaction
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error('User profile record not found. Please log in again.');
    }

    const userData = userDoc.data() as UserProfile;
    if (userData.status === 'suspended') {
      throw new Error('Your account is currently suspended. Please contact support.');
    }

    const currentBalance = Number(userData.balance) || 0;
    const price = Number(params.price);

    if (currentBalance < price) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    const newBalance = Number((currentBalance - price).toFixed(4));
    const newTotalPurchased = Number(((userData.totalPurchased || 0) + price).toFixed(4));
    const nowIso = new Date().toISOString();

    // 1. Deduct balance and update user
    transaction.update(userRef, {
      balance: newBalance,
      totalPurchased: newTotalPurchased,
      updatedAt: nowIso,
    });

    // 2. Create Order document
    const newOrder: OrderItem = {
      id: orderId,
      userId: uid,
      userEmail: currentUser.email || '',
      userFriendlyId: userData.userId,
      productId: params.productId,
      productName: params.productName,
      category: params.category,
      duration: params.duration,
      amount: price,
      status: 'pending',
      idempotencyKey: key,
      createdAt: nowIso,
    };
    transaction.set(orderRef, newOrder);

    // 3. Create Immutable Transaction Ledger Entry
    const newTx: TransactionItem = {
      id: txRef.id,
      userId: uid,
      type: 'purchase',
      amount: -price,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      referenceId: orderId,
      description: `Purchase: ${params.productName} (${params.duration})`,
      createdAt: nowIso,
    };
    transaction.set(txRef, newTx);

    // 4. Create Notification for user
    const newNotif: NotificationItem = {
      id: notifRef.id,
      userId: uid,
      title: 'Order Placed Successfully',
      message: `Your order for ${params.productName} ($${price.toFixed(2)}) is pending credentials assignment by admin.`,
      type: 'order',
      link: '/orders',
      isRead: false,
      createdAt: nowIso,
    };
    transaction.set(notifRef, newNotif);

    return {
      success: true,
      orderId,
      remainingBalance: newBalance,
    };
  });
}

/**
 * SUBMIT MANUAL USDT BEP20 DEPOSIT REQUEST
 * Prevents duplicate TxHash submissions and verifies minimum threshold.
 */
export async function submitDeposit(amount: number, txHash: string, depositAddress: string): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Authentication required.');

  const cleanTxHash = txHash.trim();
  if (!cleanTxHash || cleanTxHash.length < 10) {
    throw new Error('Invalid Transaction Hash. Please provide a valid BSC TxID.');
  }

  // Check for duplicate TxHash
  const duplicateQuery = query(collection(db, 'deposits'), where('txHash', '==', cleanTxHash));
  const duplicateSnap = await getDocs(duplicateQuery);
  if (!duplicateSnap.empty) {
    throw new Error('This Transaction Hash has already been submitted or processed.');
  }

  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const userData = userDoc.exists() ? (userDoc.data() as UserProfile) : null;

  const depositId = generateDepositId();
  const nowIso = new Date().toISOString();

  const newDeposit: DepositItem = {
    id: depositId,
    userId: currentUser.uid,
    userEmail: currentUser.email || '',
    userFriendlyId: userData?.userId || 'PB-USER',
    amount: Number(amount),
    network: 'USDT_BEP20',
    txHash: cleanTxHash,
    depositAddress,
    status: 'pending',
    createdAt: nowIso,
  };

  await setDoc(doc(db, 'deposits', depositId), newDeposit);

  // Notify user
  await addDoc(collection(db, 'notifications'), {
    userId: currentUser.uid,
    title: 'Deposit Request Submitted',
    message: `Your deposit request for $${amount.toFixed(2)} USDT (BEP20) is being verified by admin.`,
    type: 'deposit',
    link: '/deposits',
    isRead: false,
    createdAt: nowIso,
  });

  return depositId;
}

/**
 * ADMIN: APPROVE DEPOSIT AND ATOMICALLY CREDIT USER BALANCE
 */
export async function adminApproveDeposit(depositId: string, adminNotes?: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isConfiguredAdmin(currentUser.email)) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const depositRef = doc(db, 'deposits', depositId);
  const nowIso = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const depDoc = await transaction.get(depositRef);
    if (!depDoc.exists()) throw new Error('Deposit record not found.');

    const depData = depDoc.data() as DepositItem;
    if (depData.status !== 'pending') {
      throw new Error(`Deposit is already ${depData.status}.`);
    }

    const userRef = doc(db, 'users', depData.userId);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) throw new Error('User profile associated with deposit not found.');

    const userData = userDoc.data() as UserProfile;
    const currentBalance = Number(userData.balance) || 0;
    const depositAmount = Number(depData.amount) || 0;
    const newBalance = Number((currentBalance + depositAmount).toFixed(4));
    const newTotalDeposited = Number(((userData.totalDeposited || 0) + depositAmount).toFixed(4));

    // 1. Credit balance
    transaction.update(userRef, {
      balance: newBalance,
      totalDeposited: newTotalDeposited,
      updatedAt: nowIso,
    });

    // 2. Mark deposit approved
    transaction.update(depositRef, {
      status: 'approved',
      adminNotes: adminNotes || 'Verified on Binance Smart Chain.',
      reviewedBy: currentUser.email || 'Admin',
      reviewedAt: nowIso,
    });

    // 3. Ledger transaction
    const txRef = doc(collection(db, 'transactions'));
    const newTx: TransactionItem = {
      id: txRef.id,
      userId: depData.userId,
      type: 'deposit',
      amount: depositAmount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      referenceId: depositId,
      description: `USDT BEP20 Deposit Verified & Credited ($${depositAmount.toFixed(2)})`,
      createdAt: nowIso,
    };
    transaction.set(txRef, newTx);

    // 4. Notification to user
    const notifRef = doc(collection(db, 'notifications'));
    const notif: NotificationItem = {
      id: notifRef.id,
      userId: depData.userId,
      title: 'Deposit Approved! 🎉',
      message: `Your deposit of $${depositAmount.toFixed(2)} USDT has been verified and added to your balance.`,
      type: 'deposit',
      link: '/transactions',
      isRead: false,
      createdAt: nowIso,
    };
    transaction.set(notifRef, notif);

    // 5. Audit Log
    const auditRef = doc(collection(db, 'auditLogs'));
    const audit: AuditLogItem = {
      id: auditRef.id,
      adminEmail: currentUser.email || 'Admin',
      adminUid: currentUser.uid,
      action: 'APPROVE_DEPOSIT',
      targetType: 'deposit',
      targetId: depositId,
      details: JSON.stringify({ amount: depositAmount, userId: depData.userId, txHash: depData.txHash }),
      createdAt: nowIso,
    };
    transaction.set(auditRef, audit);
  });
}

/**
 * ADMIN: REJECT DEPOSIT
 */
export async function adminRejectDeposit(depositId: string, reason: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isConfiguredAdmin(currentUser.email)) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const depositRef = doc(db, 'deposits', depositId);
  const depDoc = await getDoc(depositRef);
  if (!depDoc.exists()) throw new Error('Deposit not found.');

  const depData = depDoc.data() as DepositItem;
  if (depData.status !== 'pending') throw new Error(`Deposit is already ${depData.status}.`);

  const nowIso = new Date().toISOString();
  await updateDoc(depositRef, {
    status: 'rejected',
    adminNotes: reason,
    reviewedBy: currentUser.email || 'Admin',
    reviewedAt: nowIso,
  });

  // Notify user
  await addDoc(collection(db, 'notifications'), {
    userId: depData.userId,
    title: 'Deposit Rejected',
    message: `Your deposit request for $${depData.amount.toFixed(2)} was rejected: ${reason}`,
    type: 'deposit',
    link: '/deposits',
    isRead: false,
    createdAt: nowIso,
  });

  // Audit log
  await addDoc(collection(db, 'auditLogs'), {
    adminEmail: currentUser.email || 'Admin',
    adminUid: currentUser.uid,
    action: 'REJECT_DEPOSIT',
    targetType: 'deposit',
    targetId: depositId,
    details: JSON.stringify({ reason, userId: depData.userId }),
    createdAt: nowIso,
  });
}

export interface AssignProxyParams {
  orderId: string;
  userId: string;
  userEmail: string;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: 'HTTP' | 'HTTPS' | 'SOCKS5';
  packageDuration: string;
  expiresAt: string;
  notes?: string;
}

/**
 * ADMIN: ASSIGN PROXY CREDENTIALS TO ORDER
 */
export async function adminAssignProxy(params: AssignProxyParams): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isConfiguredAdmin(currentUser.email)) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const assignmentRef = doc(collection(db, 'proxyAssignments'));
  const orderRef = doc(db, 'orders', params.orderId);
  const nowIso = new Date().toISOString();

  const newAssignment: ProxyAssignment = {
    id: assignmentRef.id,
    orderId: params.orderId,
    userId: params.userId,
    userEmail: params.userEmail,
    host: params.host.trim(),
    port: Number(params.port),
    username: params.username.trim(),
    password: params.password.trim(),
    protocol: params.protocol,
    packageDuration: params.packageDuration,
    purchaseDate: nowIso,
    expiresAt: params.expiresAt,
    status: 'active',
    notes: params.notes || 'Configured via Proxy Bazar High-Speed Gateway',
    createdAt: nowIso,
  };

  const batch = writeBatch(db);

  // 1. Save proxy assignment
  batch.set(assignmentRef, newAssignment);

  // 2. Update order to completed
  batch.update(orderRef, {
    status: 'completed',
    proxyAssignmentId: assignmentRef.id,
    assignedAt: nowIso,
  });

  // 3. User notification
  const notifRef = doc(collection(db, 'notifications'));
  batch.set(notifRef, {
    id: notifRef.id,
    userId: params.userId,
    title: 'Proxy Credentials Ready! ⚡',
    message: `Your ${params.packageDuration} proxy credentials are now active. Check My Orders to view connection details.`,
    type: 'proxy',
    link: '/orders',
    isRead: false,
    createdAt: nowIso,
  });

  // 4. Audit log
  const auditRef = doc(collection(db, 'auditLogs'));
  batch.set(auditRef, {
    id: auditRef.id,
    adminEmail: currentUser.email || 'Admin',
    adminUid: currentUser.uid,
    action: 'ASSIGN_PROXY',
    targetType: 'order',
    targetId: params.orderId,
    details: JSON.stringify({ host: params.host, port: params.port, userId: params.userId }),
    createdAt: nowIso,
  });

  await batch.commit();
  return assignmentRef.id;
}

/**
 * ADMIN: TOGGLE USER STATUS (SUSPEND/REACTIVATE)
 */
export async function adminToggleUserStatus(userId: string, newStatus: 'active' | 'suspended'): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isConfiguredAdmin(currentUser.email)) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });

  await addDoc(collection(db, 'auditLogs'), {
    adminEmail: currentUser.email || 'Admin',
    adminUid: currentUser.uid,
    action: newStatus === 'suspended' ? 'SUSPEND_USER' : 'REACTIVATE_USER',
    targetType: 'user',
    targetId: userId,
    createdAt: new Date().toISOString(),
  });
}

/**
 * ADMIN: SEND NOTIFICATION TO SPECIFIC USER OR ALL
 */
export async function adminSendNotification(targetUserId: string, title: string, message: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isConfiguredAdmin(currentUser.email)) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const nowIso = new Date().toISOString();
  await addDoc(collection(db, 'notifications'), {
    userId: targetUserId,
    title,
    message,
    type: 'system',
    isRead: false,
    createdAt: nowIso,
  });

  await addDoc(collection(db, 'auditLogs'), {
    adminEmail: currentUser.email || 'Admin',
    adminUid: currentUser.uid,
    action: 'SEND_NOTIFICATION',
    targetType: 'notification',
    targetId: targetUserId,
    details: JSON.stringify({ title }),
    createdAt: nowIso,
  });
}

/**
 * ADMIN: SAVE GLOBAL SETTINGS
 */
export async function adminSaveSettings(settings: Partial<PlatformSettings>): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isConfiguredAdmin(currentUser.email)) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const settingsRef = doc(db, 'settings', 'main');
  const payload = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: currentUser.email,
  };
  await setDoc(settingsRef, payload, { merge: true });

  await addDoc(collection(db, 'auditLogs'), {
    adminEmail: currentUser.email || 'Admin',
    adminUid: currentUser.uid,
    action: 'UPDATE_SETTINGS',
    targetType: 'settings',
    targetId: 'main',
    createdAt: new Date().toISOString(),
  });
}

/**
 * ADMIN: ADD OR EDIT PRODUCT
 */
export async function adminSaveProduct(product: Partial<ProductItem> & { id?: string }): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isConfiguredAdmin(currentUser.email)) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const nowIso = new Date().toISOString();
  if (product.id) {
    const prodRef = doc(db, 'products', product.id);
    await updateDoc(prodRef, {
      ...product,
      updatedAt: nowIso,
    });
    return product.id;
  } else {
    const newRef = doc(collection(db, 'products'));
    await setDoc(newRef, {
      ...product,
      id: newRef.id,
      createdAt: nowIso,
    });
    return newRef.id;
  }
}
