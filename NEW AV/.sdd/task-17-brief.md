# Task 17: SearchResults 搜索结果页面

**Files to modify:**
- `src/views/SearchResults.vue` (full rewrite from placeholder)

## Requirements

Search results page showing movies and actresses side by side.

### Layout

```
SearchResults (route: /search?q=xxx)
  Two sections:
    🎬 影片结果 (N)
      - Small list or grid of movie cards
    👩 女优结果 (N)
      - Grid of actress cards
  Empty state: "没有找到与 "xxx" 相关的结果"
```

### API
- `window.api.searchAll(query)` → `{ movies, actresses, query }`

### States
- Loading
- Error
- Normal (both sections, or one empty)
- Empty (no results at all)

### What to do

1. Rewrite `src/views/SearchResults.vue`
2. Build & commit
