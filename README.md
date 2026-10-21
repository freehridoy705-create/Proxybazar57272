# Proxy Bazar — High-Speed Digital Marketplace

Proxy Bazar is a modern, mobile-first digital marketplace web application designed for high-performance time-based proxy packages (1.5H, 3H, 5H, 10H, 1D), premium residential and datacenter proxies, and authorized digital services.

## Key Features

1. **Branding & Visuals**:
   - Original shield & interconnected network proxy logo.
   - Light blue, white, and soft purple accents with light and dark mode toggles.
   - Full bilingual support (English and বাংলা).
   - Responsive top navigation and mobile bottom dock navigation menu optimized for Android.

2. **Real Authentication (Firebase Auth)**:
   - Email/password Sign Up, Sign In, and Google Sign-In.
   - Forgot Password with automated reset email.
   - Email verification dispatch.
   - Unique User IDs formatted as `PB-XXXXX`.

3. **Real Database & Security (Firebase Firestore)**:
   - Dedicated collections: `users`, `products`, `orders`, `deposits`, `transactions`, `proxyAssignments`, `notifications`, `settings`, `auditLogs`.
   - Hardened `firestore.rules` preventing users from tampering with balances or self-approving deposits.
   - Private proxy credentials isolation (only the assigned user and administrators can view).

4. **User Dashboard**:
   - Available balance in USD.
   - Total lifetime deposits & purchases.
   - Recent transaction audit stream and active proxy connection details.
   - 6 Quick Actions: Proxy Buy, Digital Products, Deposit, Transaction History, My Profile, Contact Support.

5. **Proxy Buy System**:
   - 5 Pricing Cards:
     - 1.5 Hours — $0.15
     - 3 Hours — $0.30
     - 5 Hours — $0.50
     - 10 Hours — $0.70
     - 1 Day — $1.00
   - Checkout modal with balance check, atomic balance deduction, idempotency key deduplication.
   - Pending state until credentials assignment.

6. **Deposit System (USDT BEP20)**:
   - Admin-configured BSC wallet address with QR code.
   - Amount input and Transaction Hash (TxID) verification.
   - Duplicate TxID guard.
   - Manual admin approval with atomic balance crediting.

7. **Admin Panel**:
   - Protected route for authorized administrator emails: `hridoy152008@gmail.com` and developer email `skridoykhan705@gmail.com`.
   - Overview metrics (Total users, pending deposits, pending orders, revenue).
   - Deposit verifier with 1-click BSCScan explorer links and instant approval/rejection.
   - Order fulfillment & proxy credentials assigner (Host, Port, User, Pass, Protocol, Expiry).
   - Product catalog editor (adjust pricing, toggle availability, add new services).
   - User Directory with search, account suspension/reactivation, and custom push notices.
   - Platform settings editor (USDT address, min deposit, support telegram).
   - Audit logs recorder.

8. **Support**:
   - Configurable Telegram link: `https://t.me/Proxy_bazar_c`.

---

## Testing on Android Mobile Browsers

1. Open the shared or development URL on your Android device (Chrome or Firefox).
2. The interface automatically adapts with a sleek bottom dock navigation (Home, Proxies, Products, Deposit, Profile).
3. Test the Sign-Up flow to receive a unique `PB-XXXXX` User ID.
4. Try purchasing a proxy with $0.00 balance to verify insufficient balance rejection and one-tap redirect to deposit.
5. Submit a deposit with a test TxHash.
6. Switch to the Admin account (`hridoy152008@gmail.com` or `skridoykhan705@gmail.com`), approve the deposit, and verify the balance update.
7. Assign credentials to the order and inspect the decrypted credentials in the user's order view.
