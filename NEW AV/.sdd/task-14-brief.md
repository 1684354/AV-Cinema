# Task 14: TagBrowser 标签浏览页面

**Files to modify:**
- `src/views/TagBrowser.vue` (full rewrite from placeholder)

## Requirements

Tag browser showing all tag categories with their tags, grouped visually.

### Layout

```
Header: "🏷️ 所有标签 · N 个分类" + [+ 新增分类] button
Grid of category cards (4 columns):
  Card:
    - Category name (serif, accent2) + tag count
    - Tags as clickable chips (background: var(--surface), hover: accent)
```

Each tag shows its name only (no count needed for now).

### API
- `window.api.getTagsByCategory()` → returns array of categories, each with nested tags[]
- `window.api.createTagCategory({ name })` → new category
- `window.api.deleteTagCategory(id)` → deletes category + its tags
- `window.api.createTag({ name, categoryId })` → new tag
- `window.api.deleteTag(id)` → deletes tag

### States
- Loading
- Error
- Normal (grid of category cards)
- Empty (no categories yet)

### What to do

1. Rewrite `src/views/TagBrowser.vue`
2. Build & commit
