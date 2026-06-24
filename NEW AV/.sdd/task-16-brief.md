# Task 16: AddMovie 添加影片页面

**Files to modify:**
- `src/views/AddMovie.vue` (full rewrite from placeholder)

## Requirements

Simple add movie page.

### Layout

```
Title: "➕ 添加影片"
Subtitle: "输入番号自动抓取信息，或手动填写"
Card:
  - Input row: [番号输入框] + [🔍 抓取 button]
  - Below: placeholder info display or form
    Currently just show the input + button.
```

### API
- `window.api.createMovie(data)` → creates a new movie record
- `window.api.getMovies({search, page:1, pageSize:1})` — to check if code exists (duplicate check)

### States
- Normal (input form)
- Success toast after creation

### What to do

1. Rewrite `src/views/AddMovie.vue`
2. Build & commit
