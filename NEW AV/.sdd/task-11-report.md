# Task 11: ActressList page, ActressCard component, and actressStore

**Status:** Completed

**Commit SHA:** b6033b3

**Build result:** Success (no warnings)

**Files created:**
- `src/stores/actressStore.ts` — Pinia store with `loadActresses(reset?)`, `setSort()`, `setSearch()`, pagination, loading/error/total state
- `src/components/ActressCard.vue` — Card with 72px circular avatar (🎭), name, cup+height, movie count, hover effect, click to `/actress/:id`

**Files modified:**
- `src/views/ActressList.vue` — Full rewrite from placeholder: sort bar (作品数/姓名 toggle), debounced search input, 5-column grid of ActressCards, all 4 states (loading/error/empty/normal), load more button, scroll restore via uiStore
- `src/App.vue` — Added `ActressList` to `keep-alive` include list for scroll position persistence

**Concerns:** None.
