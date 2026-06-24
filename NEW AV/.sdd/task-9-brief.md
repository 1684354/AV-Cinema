# Task 9: MovieList 页面 + movieStore

**Files to create:**
- `src/stores/movieStore.ts`
- `src/views/MovieList.vue` (full rewrite from placeholder)

## movieStore

Pinia store with:
- State: `movies[]`, `total`, `page`, `loading`, `error`, `sort`, `filters` (hasSubtitle/isUncensored/hasChinese), `category`
- Actions: `loadMovies(reset)`, `setCategory(cat)`, `setSort(s)`, `toggleFilter(key)`, `removeMovie(id)`
- Constants: `PAGE_SIZE = 20`

```typescript
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export interface MovieFilter {
  hasSubtitle: boolean
  isUncensored: boolean
  hasChinese: boolean
}

export const useMovieStore = defineStore('movie', () => {
  const movies = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref('')
  const sort = ref('created_at')
  const filters = reactive<MovieFilter>({ hasSubtitle: false, isUncensored: false, hasChinese: false })
  const category = ref('all')
  const PAGE_SIZE = 20

  async function loadMovies(reset = false) {
    if (loading.value) return
    loading.value = true
    error.value = ''
    if (reset) { page.value = 1; movies.value = [] }

    try {
      const result = await window.api.getMovies({
        category: category.value,
        sort: sort.value,
        filters: {
          hasSubtitle: filters.hasSubtitle || undefined,
          isUncensored: filters.isUncensored || undefined,
          hasChinese: filters.hasChinese || undefined,
        },
        page: page.value,
        pageSize: PAGE_SIZE
      })
      if (reset) movies.value = result.movies
      else movies.value.push(...result.movies)
      total.value = result.total
      page.value++
    } catch (e: any) {
      error.value = e.message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  function setCategory(cat: string) { category.value = cat }
  function setSort(s: string) { sort.value = s; loadMovies(true) }
  function toggleFilter(key: keyof MovieFilter) {
    (filters as any)[key] = !(filters as any)[key]
    loadMovies(true)
  }
  function removeMovie(id: number) {
    movies.value = movies.value.filter(m => m.id !== id)
    total.value--
  }

  return { movies, total, page, loading, error, sort, filters, category, loadMovies, setCategory, setSort, toggleFilter, removeMovie }
})
```

## MovieList.vue

Four states:
1. **Loading** — spinner + "正在加载影片..."
2. **Error** — warning icon + error message + retry button
3. **Empty** — empty icon + "还没有影片" + hint to add
4. **Normal** — sort bar + card grid + load more button

Features:
- Sort bar: 加入日期/发行日期/女优名/播放次数/随机 (toggle active class)
- Filter bar: 中文字幕/破解版/无码 (toggle active class, each calls toggleFilter)
- Movie cards grid: 5 columns, 18px gap
- Load more button at bottom
- Scroll position save/restore via uiStore
- Category detection from route params

Must use `<keep-alive>` integration — the app already wraps MovieList in keep-alive from App.vue. Use `onActivated` to restore scroll.

```vue
<template>
  <div class="movie-list" ref="listRef">
    <!-- Sort & Filter Bar -->
    <div class="sort-bar">
      <span class="opt" :class="{ active: store.sort === 'created_at' }" @click="store.setSort('created_at')">加入日期</span>
      <span class="opt" :class="{ active: store.sort === 'release_date' }" @click="store.setSort('release_date')">发行日期</span>
      <span class="opt" :class="{ active: store.sort === 'actress' }" @click="store.setSort('actress')">女优名</span>
      <span class="opt" :class="{ active: store.sort === 'play_count' }" @click="store.setSort('play_count')">播放次数</span>
      <span class="opt" :class="{ active: store.sort === 'random' }" @click="store.setSort('random')">🎲 随机</span>
      <span class="spacer"></span>
      <span class="view-count">{{ store.total }} 部影片</span>
      <div class="filter-group">
        <span class="tag" :class="{ active: store.filters.hasSubtitle }" @click="store.toggleFilter('hasSubtitle')">中文字幕</span>
        <span class="tag" :class="{ active: store.filters.hasChinese }" @click="store.toggleFilter('hasChinese')">破解版</span>
        <span class="tag" :class="{ active: store.filters.isUncensored }" @click="store.toggleFilter('isUncensored')">无码</span>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="store.loading && store.movies.length === 0">
      <div class="spinner"></div><span>正在加载影片...</span>
    </div>

    <!-- Error -->
    <div class="error-state" v-else-if="store.error && store.movies.length === 0">
      <div class="icon">⚠️</div><div class="msg">{{ store.error }}</div>
      <button class="retry" @click="store.loadMovies(true)">🔄 重试</button>
    </div>

    <!-- Empty -->
    <div class="empty-state" v-else-if="!store.loading && store.movies.length === 0">
      <div class="icon">📭</div><div class="msg">还没有影片</div>
      <div class="sub">点击左侧"添加影片"开始建立你的收藏</div>
    </div>

    <!-- Normal grid -->
    <div class="grid" v-else>
      <MovieCard v-for="movie in store.movies" :key="movie.id" :movie="movie" @deleted="handleDelete" />
    </div>

    <!-- Load more -->
    <div class="load-more" v-if="store.movies.length > 0 && store.movies.length < store.total">
      <button class="btn-load" @click="store.loadMovies()" :disabled="store.loading">
        {{ store.loading ? '加载中...' : `🎬 加载更多 (${store.movies.length} / ${store.total})` }}
      </button>
    </div>
  </div>
</template>
```

Script:
- Import `useMovieStore`, `useUiStore`, `useRoute`, `MovieCard`
- `onMounted`: set category from route, call loadMovies(true)
- `watch` on `route.params.type`: update category, reload
- `onActivated`: restore scroll position from uiStore
- `handleDelete(id)`: call api.deleteMovie, then store.removeMovie

## What to do

1. Create `src/stores/movieStore.ts`
2. Rewrite `src/views/MovieList.vue` with full implementation
3. Build: `npx vite build`
4. Commit

## Working directory

`/c/Users/Administrator/Desktop/CLADUE/NEW AV`
