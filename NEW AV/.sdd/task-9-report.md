# Task 9 Report: MovieList Page + movieStore

**Status:** Complete

**Commit:** `91455c7`

**Build result:** Clean — all 3 Vite bundles (app, main, preload) built successfully with no errors.

**Files created:**
- `src/stores/movieStore.ts` — Pinia store with movies array, pagination (page/PAGE_SIZE=20), loading/error state, sort key, filters (hasSubtitle/isUncensored/hasChinese), category, and actions: loadMovies(reset), setCategory, setSort, toggleFilter, removeMovie
- `src/views/MovieList.vue` — full implementation with sort bar (5 sort options), filter bar (3 toggles), 4 states (loading spinner, error with retry, empty with hint, normal grid), 5-column card grid, load-more button, scroll position save/restore, keep-alive onActivated scroll restoration, watch on route.params.type for category navigation

**Key details:**
- Scroll position is saved per-category (`movie-list-${category}` key in uiStore)
- The empty state shows 2 lines: "还没有影片" + subtext directing user to "添加影片" in sidebar
- Category updates via route param watch call `setCategory` then `loadMovies(true)` which resets page to 1
- Filters and sort both trigger `loadMovies(true)` on change
- Lazy-load (load more) appends to existing movies array and increments page

**Concerns:** None.
