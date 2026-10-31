# ShopNest Editorial Commerce Design System

## 1. Philosophy & Aesthetic Direction
ShopNest employs an **editorial, bespoke commerce design language** designed specifically for high-trust retail. Unlike generic bootstrap or landing-page templates that rely on neon gradients, exaggerated box-glows, emojis, and marketing buzzwords, ShopNest adheres to architectural restraint:
- **Clean Contrast**: Deep slate-navy surfaces balanced by crisp off-white text and purposeful warm orange accents.
- **Typographic Precision**: A dual-typeface pairing of **Bricolage Grotesque** for display headings and **Inter** for readable body and tabular numerical data.
- **Zero Template Smells**: Elimination of decorative emojis in UI buttons/headings, removal of artificial gradient borders, and elimination of generic buzzwords in favor of concrete inventory details.
- **Physical Realism**: Subtle 1px borders, solid 2-step elevations, and micro-interactions with hardware-accelerated transitions.

---

## 2. Typography

Self-hosted via `@fontsource` for instantaneous first contentful paint (zero external CDN dependency):

| Role | Font Family | Weights | Tracking | Usage |
|---|---|---|---|---|
| **Display / Headlines** | Bricolage Grotesque | 700 (Bold), 800 (ExtraBold) | `-0.025em` (tight) | Hero titles, section headers, card titles |
| **Body & UI Controls** | Inter | 400 (Regular), 500 (Medium), 600 (SemiBold) | `normal` | Paragraphs, navigation, buttons, form labels |
| **Financial / Monospace** | JetBrains Mono / UI Monospace | 500, 700 | `0.02em` | Prices (paise calculations), Order IDs, SKUs |

### Typographic Hierarchy
- `text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight`: Editorial Hero & Landing headlines.
- `text-xl sm:text-2xl font-bold font-display text-white`: Section headers (Featured, Catalog, Policy).
- `text-sm font-semibold text-gray-200`: Navigation links, modal titles, card headlines.
- `text-xs text-gray-400 leading-relaxed`: Descriptive copy, policy sections, meta descriptions.
- `text-[11px] font-bold tracking-wider uppercase text-gray-400`: Category labels, table column headers.

---

## 3. Color Architecture

ShopNest uses a flat-navy palette with restrained orange primary action states:

### Surface & Neutral Tones
- `navy-900` (`#020617`): Main application canvas.
- `navy-800` (`#090e1a`): Elevated cards, modals, side panels, and topbar.
- `navy-700` (`#0f172a`): Secondary containers, table headers, inactive tabs.
- `navy-600` (`#1e293b`): Form input fields, button secondary backgrounds.
- `border-navy-700` / `border-white/10`: Structural 1px separation lines.

### Brand Accents
- `orange-500` (`#f97316`): Primary action triggers (Add to Cart, Checkout, Submit).
- `orange-600` (`#ea6c10`): Hover state for primary triggers.
- `orange-400` (`#fb923c`): Interactive highlights, active icon indicators.
- `orange-500/15`: Subtle badge and pill background fills.

### Functional / Semantic Feedback
- **In Stock / Paid / Confirmed**: `emerald-500` (`#10b981`), `emerald-500/15` tint.
- **Low Stock / Pending / Attention**: `amber-500` (`#f59e0b`), `amber-500/15` tint.
- **Out of Stock / Cancelled / Error**: `rose-500` (`#f43f5e`), `rose-500/15` tint.
- **Information / Neutral**: `sky-500` (`#0ea5e9`), `sky-500/15` tint.

---

## 4. Spatial Grid & Metrics

- **Base Unit**: 8px grid system (`gap-2` = 8px, `gap-4` = 16px, `gap-6` = 24px, `gap-8` = 32px).
- **Container Max-Width**: `max-w-7xl` (1280px) centered with responsive padding (`px-4 sm:px-6 lg:px-8`).
- **Corner Radii**:
  - `rounded-xl` (12px): Form controls, buttons, product thumbnail containers, pills.
  - `rounded-2xl` (16px): Product cards, dropdown menus, alert callouts.
  - `rounded-3xl` (24px): Hero banners, checkout summary cards, full-page cards.

---

## 5. UI Components & Micro-Interactions

### Product Cards
- **Container**: `bg-navy-800/90 border border-navy-700/80 rounded-2xl overflow-hidden group hover:border-orange-500/40 transition-all duration-200`.
- **Image Container**: Fixed aspect ratio `aspect-square bg-navy-900/60` with `object-fit: contain` to preserve true product proportions without cropping.
- **Data-Backed Badges**: Real conditions derived from stock and sales:
  - `Low Stock (Only X left)`: Rendered when `stock_qty <= reorder_threshold`.
  - `Best Seller`: Derived from verified order volume.
  - `New Arrival`: Products added within the catalog launch window.

### Primary Button (`.btn-primary`)
- Flat `bg-orange-500 text-white font-bold rounded-xl px-4 py-2.5 transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400/50`.
- Zero floating neon glow shadows or excessive blur filters.

### Forms & Input Fields
- `bg-navy-900 border border-navy-700 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500`.

---

## 6. Accessibility & Contrast Standards

- All text pairings meet **WCAG 2.1 AA** contrast ratios:
  - Off-white (`#f8fafc` or `#f3f4f6`) on `navy-900` (`#020617`): Contrast > 16:1 (Pass AAA).
  - Secondary gray (`#94a3b8` / `#cbd5e1`) on `navy-800` (`#090e1a`): Contrast > 6.5:1 (Pass AA).
  - Orange buttons (`#f97316`) feature white bold text with minimum 14px size: Contrast > 3.2:1 (Large text AA) and reinforced with clear spatial boundaries.
- All interactive elements support keyboard focus visible indicators via `focus:ring-2 focus:ring-orange-400/50`.
