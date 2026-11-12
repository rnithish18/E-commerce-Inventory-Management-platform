# ShopNest --- Redesign Progress

## Baseline (before redesign --- Vitest run via Supabase)
- **Test Files**: 14 failed | 5 passed (19 total)
- **Tests**: 70 failed | 102 passed | 76 skipped (248 total)
- Failures are all pre-existing: DB-backed integration tests that need a seeded local DB.
  The CSRF unit tests (26) all pass.
- Playwright: not run at baseline (no local dev server).

---

## Phase B --- Layout Shell + Design Tokens COMPLETE

| Task | Status |
|------|--------|
| tailwind.config.js redesigned | done |
| index.css redesigned | done |
| Light theme default in main.tsx | done |
| Toast moved to bottom-right | done |
| StorefrontLayout.tsx --- no sidebar, no right panel | done |
| Topbar.tsx rewritten | done |
| CategoryBar.tsx created | done |
| MobileTabBar.tsx created | done |
| docs/design-system.md | done |

## Phase C --- Pages + Copy Cleanup COMPLETE

| Task | Status |
|------|--------|
| HomePage.tsx rewritten | done |
| HeroBanner.tsx fixed (no text/image overlap) | done |
| CategoryTiles.tsx fixed (no name clipping) | done |
| ProductCard.tsx rewritten | done |
| ProductImage.tsx --- no SVG placeholders | done |
| ShopPage.tsx refactored | done |
| Footer --- fake claims removed | done |

## Upcoming
- Phase D: Seed expansion to 150 products
- Phase E: Real images (zero placeholders)
- Phase F: Bug fixes
- Phase G: Performance
- Phase H: Final verification + deploy
