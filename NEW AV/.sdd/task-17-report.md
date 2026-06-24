# Task 17 Report: SearchResults page

**Status:** Complete

**Commit SHA:** `de9ebcb`

**Build result:** Passed (vite v5.4.21, built in 6.08s)

**Files modified:**
- `src/views/SearchResults.vue` -- rewritten from placeholder to full implementation

## Implementation details

- Calls `window.api.searchAll(query)` on mount, reading `route.query.q`
- Four states handled: loading, error, empty ("没有找到与 'xxx' 相关的结果"), normal
- Two result sections: movie grid (MovieCard) and actress grid (ActressCard)
- Sticky header bar showing search query and result counts
- Uses existing MovieCard and ActressCard components with matching design patterns (spinner, retry button, responsive grids)
- Handles MovieCard's `deleted` and `favChanged` events so the results list stays in sync

## Concerns

- The component does not re-search if the query param changes while already mounted (e.g. user types a second search from the page itself). The SearchBar component navigates to `/search?q=xxx` which remounts the view via vue-router, so this is fine for the current flow.
