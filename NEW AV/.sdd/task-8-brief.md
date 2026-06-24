# Task 8: MovieCard 组件

**Files to create:**
- `src/components/MovieCard.vue`

## Requirements

A reusable movie card component with:
- Cover image placeholder (🎬 emoji as fallback)
- Code (番号) in `var(--accent2)` color
- Title text (2-line clamp)
- Release date and duration metadata
- Tags: red (`var(--rose)`) for actress-related keywords, blue (`var(--blue)`) for movie-related tags
- Flag badges: 🔥 精选 (within 7 days of created_at), 中字, 无码, 破解
- Favorite heart toggle (♡/♥)
- Right-click context menu: 播放, 打开文件位置, ✏️ 编辑影片, separator, ♥ 收藏, 🗑️ 删除
- Click navigates to `/movie/${id}`
- Hover effect: translateY(-5px), shadow increase, 1px rose border

**Props:** `movie: any`
**Emits:** `deleted(id)`, `favChanged(id, isFav)`

**Keyword classification for tag colors:**
Actress-related keywords: `['巨乳', '美乳', '贫乳', '美腿', '丰满', '单体', '引退', '新人', '美脚', '爆乳', '微乳', '美臀', '细腰', '长腿']`
Everything else → blue (movie-related tag)

## Expected output

```vue
<template>
  <div class="card" @click="goDetail" @contextmenu.prevent="showContextMenu">
    <div class="thumb">
      <div class="flags" v-if="hasFlags">
        <span v-if="isNew" class="accent">🔥 精选</span>
        <span v-if="movie.has_subtitle">中字</span>
        <span v-if="movie.is_uncensored">无码</span>
        <span v-if="movie.has_chinese">破解</span>
      </div>
      <span class="fav" :class="{ active: movie.is_favorite }" @click.stop="toggleFav">
        {{ movie.is_favorite ? '♥' : '♡' }}
      </span>
      <div class="thumb-placeholder">🎬</div>
    </div>
    <div class="body">
      <div class="code">{{ movie.code || '未知' }}</div>
      <div class="title">{{ movie.title || '未命名' }}</div>
      <div class="meta" v-if="movie.release_date || movie.duration">
        <span v-if="movie.release_date">{{ movie.release_date }}</span>
        <span v-if="movie.duration">{{ movie.duration }}min</span>
      </div>
      <div class="tags" v-if="parsedTags.length > 0">
        <span v-for="tag in parsedTags.slice(0, 4)" :key="tag" :class="tagClass(tag)">
          {{ tag }}
        </span>
      </div>
    </div>
    <!-- Context menu -->
    <Teleport to="body">
      <div class="ctx-menu" v-if="ctxVisible" :style="ctxStyle" @click.stop>
        <div class="ctx-item" @click="play">▶ 播放</div>
        <div class="ctx-item" @click="openLocation">📂 打开文件位置</div>
        <div class="ctx-item" @click="goDetail">✏️ 编辑影片</div>
        <div class="ctx-sep"></div>
        <div class="ctx-item" @click="toggleFav">{{ movie.is_favorite ? '♥' : '♡' }} 收藏</div>
        <div class="ctx-item danger" @click="confirmDelete">🗑️ 删除</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// ... full script with computed, methods, etc.
</script>

<style scoped>
/* Card styles matching the darkroom mockup */
.card { background: var(--bg2); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); transition: var(--transition); cursor: pointer; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(0,0,0,.4), 0 0 0 1px rgba(162,74,58,.25); }
.thumb { aspect-ratio: 3/4; background: linear-gradient(135deg, var(--surface), var(--border)); display: flex; align-items: center; justify-content: center; font-size: 32px; position: relative; }
.thumb .flags { position: absolute; top: 8px; left: 8px; display: flex; gap: 4px; flex-wrap: wrap; }
.thumb .flags span { padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 600; background: rgba(0,0,0,.7); color: var(--fg); }
.thumb .flags .accent { background: var(--accent); color: #fff; }
.thumb .fav { position: absolute; top: 8px; right: 8px; font-size: 16px; color: rgba(255,255,255,.5); transition: var(--transition); z-index: 2; }
.thumb .fav:hover { color: var(--accent2); }
.thumb .fav.active { color: var(--accent2); }
.body { padding: 12px 14px 14px; }
.code { font-size: 11px; color: var(--accent2); font-weight: 700; letter-spacing: .5px; }
.title { font-size: 13px; margin-top: 4px; color: var(--fg); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }
.meta { font-size: 11px; color: var(--fg3); margin-top: 6px; display: flex; gap: 6px; }
.tags { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.tags span { font-size: 9px; padding: 2px 7px; border-radius: 5px; }
.tags .r { background: rgba(162,74,58,.2); color: var(--rose); }
.tags .b { background: rgba(59,100,140,.2); color: var(--blue); }

/* Context menu with Teleport to body */
.ctx-menu { position: fixed; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px; box-shadow: var(--shadow); z-index: 1000; min-width: 160px; }
.ctx-item { padding: 8px 14px; border-radius: 6px; font-size: 13px; color: var(--fg3); transition: var(--transition); cursor: pointer; }
.ctx-item:hover { background: var(--surface); color: var(--fg); }
.ctx-item.danger:hover { background: rgba(162,74,58,.2); color: var(--rose); }
.ctx-sep { margin: 4px 0; border-top: 1px solid var(--border); }
</style>
```

## What to do

Create the full `MovieCard.vue` component with:
1. All computed properties (isNew, hasFlags, parsedTags, tagClass)
2. Context menu show/hide with document click listener
3. Teleported context menu to body (to avoid clipping)
4. All methods: goDetail, toggleFav, play, openLocation, confirmDelete
5. Emit handling for `deleted` and `favChanged`

Build & commit.

## Working directory

`/c/Users/Administrator/Desktop/CLADUE/NEW AV`
