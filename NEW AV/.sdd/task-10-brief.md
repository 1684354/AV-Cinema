# Task 10: MovieDetail 页面

**Files to modify:**
- `src/views/MovieDetail.vue` (full rewrite from placeholder)

## Requirements

Movie detail page with full information display and editing capabilities.

### Layout (matches mockup-darkroom-complete.html)

```
Detail header: ◀ Back | Movie Detail | [Edit] [Favorite] [Play]
Large preview area (400px height, dark bg) with dot navigation
Filmstrip row: horizontal scrollable thumbnail strip
Two-column grid below:
  Column 1: Info panel
    - Code (番号) with copy button
    - Category badge (AV · 有码)
    - Title
    - Info fields: Actress(linked), Release date, Duration, Series, Play count, File size
  Column 2: Tags + actions
    - Actress tags (rose/red)
    - Movie tags (blue)  
    - Action buttons: [Translate] [Open location] [Search online]
```

### States

1. **Loading** — spinner
2. **Normal** — full detail view
3. **Error** — "影片不存在" + 返回按钮
4. **Empty** — shouldn't happen with proper routing but handle

### Key interactions

- Actress name click → navigate to `/actress/:id`
- Copy button → copies code to clipboard
- Favorite toggle → calls `window.api.toggleMovieFavorite(id)`
- Play button → calls `window.api.playMovie(videoPath)`
- Open location → calls `window.api.openFileLocation(videoPath)`
- Edit button → toggles edit mode (fields become editable inputs)

### Props/Route
- Route param: `id` (movie ID)
- Fetch: `window.api.getMovie(id)` on mount

### Code template

```vue
<template>
  <div class="detail-page">
    <!-- Header -->
    <div class="detail-header">
      <span class="back" @click="goBack">◀</span>
      <span class="loc">影片详情</span>
      <div class="actions">
        <button @click="toggleEdit">{{ isEditing ? '💾 保存' : '✏️ 编辑' }}</button>
        <button @click="toggleFav">{{ movie?.is_favorite ? '♥' : '♡' }}</button>
        <button class="play" @click="play">▶ 播放</button>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="loading">...</div>
    <!-- Error -->
    <div class="error-state" v-else-if="error">...</div>
    <!-- Normal -->
    <template v-else-if="movie">
      <!-- Preview area -->
      <div class="preview-area">🎬</div>
      <!-- Filmstrip -->
      <div class="filmstrip">...</div>
      <!-- Detail grid -->
      <div class="detail-grid">
        <div class="info-panel">...</div>
        <div class="info-panel">...</div>
      </div>
    </template>
  </div>
</template>
```

## What to do

1. Rewrite `src/views/MovieDetail.vue` replacing the placeholder
2. Build: `npx vite build`
3. Commit

## Working directory

`/c/Users/Administrator/Desktop/CLADUE/NEW AV`
