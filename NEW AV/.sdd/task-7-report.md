# Task 7 Report: App main layout with sidebar, search bar, and uiStore

**Status:** Complete

**Commit SHA:** `1f12eff`

**Build result:** PASS
- Vite frontend build: success (1628 modules, 3.94s)
- Electron main build: success (11 modules, 38ms)
- Electron preload build: success (1 module, 6ms)

**Files created:**
- `src/stores/uiStore.ts` — Pinia store with scrollPositions, isDetailView, sidebarCollapsed
- `src/components/SearchBar.vue` — search input with enter-to-search, navigates to `/search?q=`
- `src/components/Sidebar.vue` — sidebar with 3 groups (browse/discover/manage), router-link items, active state styling, movie count badge fetched via `window.api.getMovieCount()`

**Files modified:**
- `src/App.vue` — full layout rewrite:
  - Detail mode detection: watches `route.path`, hides Sidebar+topbar for `/movie/` and `/actress/` routes
  - `keep-alive` wrapping MovieList component
  - Random button calling `window.api.getMovies({ sort: 'random' })`, navigates to the result
  - Topbar with SearchBar search bar + action buttons
  - Two display modes: normal (sidebar + topbar + view-container) and detail-mode (full-screen router-view only)

**Concerns:**
- None. No TypeScript errors, no missing imports, all CSS variable references match existing theme.
