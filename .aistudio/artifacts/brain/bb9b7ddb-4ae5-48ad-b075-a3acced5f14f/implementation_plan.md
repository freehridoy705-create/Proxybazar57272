# Proxy Duration Category Filter for ProxyBuyPage

Add a duration category filter toggle to the **ProxyBuyPage** allowing users to switch between **All**, **Short-term** (1.5H, 3H), **Medium-term** (5H, 10H), and **Long-term** (1 Day) proxy packages with real-time filtering and package count indicators.

## User Review & Critical Decisions

> [!IMPORTANT]
> The duration category filter enhances package discoverability while preserving live real-time synchronization with Firebase Firestore.

- **Duration Grouping Schema**:
  - **All**: Displays all available active packages ($5$ default packages).
  - **Short-term**: Packages under $4$ hours (e.g. $1.5$ Hours @ $\$0.15$, $3$ Hours @ $\$0.30$) — ideal for fast verification, survey completion, and quick tasks.
  - **Medium-term**: Packages between $4$ and $12$ hours (e.g. $5$ Hours @ $\$0.50$, $10$ Hours @ $\$0.70$) — suitable for extended research, scraping sessions, and automation work.
  - **Long-term**: Packages $24+$ hours (e.g. $1$ Day @ $\$1.00$) — for continuous daily uninterrupted proxy access.
- **UI Control**:
  - Segmented control container with smooth active tab transitions, counter badges, and touch-optimized tap targets ($\ge 44\text{px}$) for mobile devices.
  - Full English and বাংলা (Bangla) translations added to `src/utils/translations.ts`.

---

## 1. Overview & Core Concept

- **What It Does**: Introduces a duration category selector right above the pricing cards on the Proxy Buy page. When clicked, it filters the active package list to match the user's intended session duration.
- **Target Audience**: Users seeking quick short-term proxy tests vs. power users looking for day-long dedicated proxies.
- **Key Value**: Eliminates cognitive load, accelerates selection, and maintains full mobile responsiveness.

---

## 2. User Experience & Visual Design

### Key User Flows
1. User lands on the **Proxy Buy** page.
2. Below the hero banner, a horizontal segmented filter bar displays:
   - `All Packages (5)`
   - `Short-term (2)`
   - `Medium-term (2)`
   - `Long-term (1)`
3. Tapping any category filters the displayed pricing cards with a clean opacity and layout transition ($\le 150\text{ms}$).
4. Selecting a package retains the atomic balance checkout modal, idempotency key generation, and confidential proxy credentials assignment.

### Visual Identity & Theme
- **Segmented Control Styling**:
  - Subtle background container (`bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl`).
  - Active button: `bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm font-bold`.
  - Inactive button: `text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white`.
- **Count Indicator**: Small, subdued numeric badge displaying matching package count for each duration tier.
- **Empty State**: Friendly fallback if an admin disables all packages in a specific category.

---

## 3. Key Product Decisions & Trade-Offs

- **Client-Side Filtering on Top of Firestore Stream**:
  - *Chosen Approach*: Maintain the existing real-time Firestore `onSnapshot` listener on `products` where `category == 'proxy_time'`, then apply pure React memoized category filtering.
  - *Why*: Instant $0\text{ms}$ filter switching without triggering extra Firestore read queries or incurring additional quota costs.
- **Bilingual Consistency**:
  - Category titles and filter badges provided in both English and Bangla via `getT(language)`.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   ProxyBuyPage State                   │
│                                                        │
│  packages: ProductItem[] (Firestore live onSnapshot)   │
│  durationFilter: 'all' | 'short' | 'medium' | 'long'   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Filtered Package Computation               │
│                                                        │
│  • 'all'    => All packages                            │
│  • 'short'  => durationHours <= 3.5                   │
│  • 'medium' => durationHours > 3.5 && <= 12           │
│  • 'long'   => durationHours > 12                     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              Segmented Filter Controller               │
│  [All (5)] [Short-term (2)] [Medium (2)] [Long (1)]    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           Responsive Pricing Cards Grid                │
│  (1.5h - $0.15, 3h - $0.30, 5h - $0.50, ...)          │
└────────────────────────────────────────────────────────┘
```

### Components to Update
1. `src/utils/translations.ts`:
   - Add translation keys for `filterAll`, `filterShortTerm`, `filterMediumTerm`, `filterLongTerm`, and duration category descriptions in English and Bangla.
2. `src/components/proxies/ProxyBuyPage.tsx`:
   - Add `durationFilter` state (`'all' | 'short' | 'medium' | 'long'`).
   - Add helper function `getDurationCategory(pkg: ProductItem): 'short' | 'medium' | 'long'`.
   - Render the responsive segmented duration filter control.
   - Filter package grid and display category-specific count badges.
3. Verification:
   - Run `compile_applet` and `lint_applet` to ensure type-safety and smooth compilation.
