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

<script setup lang="ts">
import { ref, onMounted, watch, onActivated, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMovieStore } from '@/stores/movieStore'
import { useUiStore } from '@/stores/uiStore'
import MovieCard from '@/components/MovieCard.vue'

const route = useRoute()
const router = useRouter()
const store = useMovieStore()
const uiStore = useUiStore()

const listRef = ref<HTMLElement | null>(null)

// Load movies on mount
onMounted(() => {
  const cat = (route.params.type as string) || 'all'
  store.setCategory(cat)
  store.loadMovies(true)
})

// Watch route param changes for category navigation
watch(() => route.params.type, (newType) => {
  const cat = (newType as string) || 'all'
  store.setCategory(cat)
  store.loadMovies(true)
})

// Restore scroll position when re-activated from keep-alive
onActivated(() => {
  const key = `movie-list-${store.category}`
  const saved = uiStore.getScroll(key)
  if (saved > 0 && listRef.value?.parentElement) {
    nextTick(() => {
      listRef.value!.parentElement!.scrollTop = saved
    })
  }
})

// Save scroll position on scroll
function saveScroll() {
  const key = `movie-list-${store.category}`
  const parent = listRef.value?.parentElement
  if (parent) {
    uiStore.saveScroll(key, parent.scrollTop)
  }
}

// Handle movie deletion
async function handleDelete(id: number) {
  try {
    await window.api.deleteMovie(id)
    store.removeMovie(id)
  } catch (err) {
    console.error('Failed to delete movie:', err)
  }
}
</script>

<style scoped>
.movie-list { padding: 0; }

/* Sort bar */
.sort-bar { display: flex; align-items: center; padding: 14px 28px; gap: 8px; flex-wrap: wrap; border-bottom: 1px solid var(--border); background: var(--bg); position: sticky; top: 0; z-index: 10; }
.opt { font-size: 12px; color: var(--fg3); padding: 5px 12px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg2); cursor: pointer; transition: var(--transition); }
.opt:hover { color: var(--fg); border-color: var(--accent2); }
.opt.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.spacer { flex: 1; }
.view-count { font-size: 12px; color: var(--fg4); margin-right: 8px; white-space: nowrap; }
.filter-group { display: flex; gap: 6px; }
.tag { font-size: 11px; padding: 4px 10px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg2); color: var(--fg4); cursor: pointer; transition: var(--transition); }
.tag:hover { border-color: var(--accent2); color: var(--fg); }
.tag.active { background: var(--accent2); color: #fff; border-color: var(--accent2); }

/* States */
.loading-state, .error-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; }
.loading-state .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-state span { color: var(--fg3); font-size: 14px; }
.error-state .icon, .empty-state .icon { font-size: 48px; }
.error-state .msg, .empty-state .msg { color: var(--fg3); font-size: 15px; }
.empty-state .sub { color: var(--fg4); font-size: 12px; }
.retry { padding: 8px 20px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg2); color: var(--fg); font-size: 13px; cursor: pointer; transition: var(--transition); }
.retry:hover { background: var(--surface); border-color: var(--accent); }

/* Grid */
.grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; padding: 24px 28px; }

/* Load more */
.load-more { display: flex; justify-content: center; padding: 24px 28px 40px; }
.btn-load { padding: 10px 32px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg2); color: var(--fg3); font-size: 13px; cursor: pointer; transition: var(--transition); }
.btn-load:hover:not(:disabled) { background: var(--surface); color: var(--fg); border-color: var(--accent2); }
.btn-load:disabled { opacity: .5; cursor: not-allowed; }
</style>
