# Task 12: ActressDetail 页面

**Files to modify:**
- `src/views/ActressDetail.vue` (full rewrite from placeholder)

## Requirements

Full actress detail page matching the mockup-darkroom-complete.html design.

### Layout

```
Header: ◀ Back | Actress Name | [Edit] [Favorite]
Large avatar + info section:
  - 140px circular avatar (🎭 placeholder)
  - Name (large serif, accent2 color) + name_cn subtitle
  - Info row: Birthday, Height, BWH (三围), Cup, Debut date, Movie count
  - Tags: breast_type (人工/天然) and is_mature (熟女) as rose-colored chips
Works list (女优作品列表):
  - "作品列表 · N 部" title
  - Filter row: 全部/有码/无码/中字
  - 5-column grid of MovieCards
```

### States
- Loading
- Error ("女优不存在" + 返回)
- Normal (full detail + works list)
- Empty works (女优存在但没有作品)

### API
- `window.api.getActress(id)` → actress object
- `window.api.getActressMovies(actressId)` → movies[]
- `window.api.toggleActressFavorite(id)` → boolean
- `window.api.updateActress(id, data)` → updated actress

### Key interactions
- Back button → go to /actresses
- Edit button → toggle edit mode for fields
- Favorite toggle
- Click movie card → navigate to /movie/:id
- Category filter on works list toggles movie visibility

## What to do

1. Rewrite `src/views/ActressDetail.vue` replacing the placeholder
2. Build: `npx vite build`
3. Commit

## Working directory

`/c/Users/Administrator/Desktop/CLADUE/NEW AV`
