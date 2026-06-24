<template>
  <div class="search-results">
    <!-- Header bar -->
    <div class="header">
      <span class="title">搜索：{{ query }}</span>
      <span class="counts" v-if="!loading && !error">
        <span class="count-movies">🎬 {{ movies.length }} 部影片</span>
        <span class="count-actresses">👩 {{ actresses.length }} 位女优</span>
      </span>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <span>正在搜索...</span>
    </div>

    <!-- Error -->
    <div class="error-state" v-else-if="error">
      <div class="icon">⚠️</div>
      <div class="msg">{{ error }}</div>
      <button class="retry" @click="doSearch">🔄 重试</button>
    </div>

    <!-- Empty (no results at all) -->
    <div class="empty-state" v-else-if="noResults">
      <div class="icon">🔍</div>
      <div class="msg">没有找到与 "{{ query }}" 相关的结果</div>
      <div class="sub">尝试使用其他关键词搜索</div>
    </div>

    <!-- Normal results -->
    <template v-else>
      <!-- Movie results section -->
      <div class="section" v-if="movies.length > 0">
        <div class="section-title">
          <span class="section-ico">🎬</span>
          <span>影片结果</span>
          <span class="section-count">{{ movies.length }}</span>
        </div>
        <div class="movie-grid">
          <MovieCard
            v-for="movie in movies"
            :key="movie.id"
            :movie="movie"
            @deleted="onMovieDeleted"
            @favChanged="onMovieFavChanged"
          />
        </div>
      </div>

      <!-- Actress results section -->
      <div class="section" v-if="actresses.length > 0">
        <div class="section-title">
          <span class="section-ico">👩</span>
          <span>女优结果</span>
          <span class="section-count">{{ actresses.length }}</span>
        </div>
        <div class="actress-grid">
          <ActressCard
            v-for="actress in actresses"
            :key="actress.id"
            :actress="actress"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import MovieCard from '@/components/MovieCard.vue'
import ActressCard from '@/components/ActressCard.vue'

const route = useRoute()

// State
const loading = ref(false)
const error = ref('')
const movies = ref<any[]>([])
const actresses = ref<any[]>([])
const query = ref('')

// Computed
const noResults = computed(() => {
  return !loading.value && !error.value && movies.value.length === 0 && actresses.value.length === 0
})

// Methods
async function doSearch() {
  const q = (route.query.q as string) || ''
  if (!q.trim()) return

  query.value = q.trim()
  loading.value = true
  error.value = ''
  movies.value = []
  actresses.value = []

  try {
    const result = await window.api.searchAll(query.value)
    movies.value = result.movies || []
    actresses.value = result.actresses || []
  } catch (err: any) {
    console.error('Search failed:', err)
    error.value = err.message || '搜索失败，请重试'
  } finally {
    loading.value = false
  }
}

function onMovieDeleted(id: number) {
  movies.value = movies.value.filter((m: any) => m.id !== id)
}

function onMovieFavChanged(id: number, isFav: boolean) {
  const movie = movies.value.find((m: any) => m.id === id)
  if (movie) movie.is_favorite = isFav
}

// Load on mount
onMounted(() => {
  doSearch()
})

// Re-search when query changes
watch(() => route.query.q, () => {
  doSearch()
})
</script>

<style scoped>
.search-results { padding: 0; }

/* Header */
.header {
  display: flex;
  align-items: center;
  padding: 14px 28px;
  gap: 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header .title {
  font-size: 15px;
  font-weight: 600;
  color: var(--fg);
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header .counts {
  display: flex;
  gap: 12px;
  margin-left: auto;
}
.count-movies, .count-actresses {
  font-size: 12px;
  color: var(--fg3);
  white-space: nowrap;
}

/* States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
}
.loading-state .spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-state span { color: var(--fg3); font-size: 14px; }
.error-state .icon, .empty-state .icon { font-size: 48px; }
.error-state .msg, .empty-state .msg { color: var(--fg3); font-size: 15px; }
.empty-state .sub { color: var(--fg4); font-size: 12px; }
.retry {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--fg);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}
.retry:hover { background: var(--surface); border-color: var(--accent); }

/* Sections */
.section { padding: 20px 28px 12px; }
.section + .section { border-top: 1px solid var(--border); }

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 16px;
}
.section-ico { font-size: 18px; }
.section-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent2);
  background: rgba(162,74,58,.12);
  padding: 2px 9px;
  border-radius: 10px;
  margin-left: 4px;
}

/* Movie grid */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
}

/* Actress grid */
.actress-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
}

/* Responsive fallback for smaller viewports */
@media (max-width: 1100px) {
  .movie-grid, .actress-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 800px) {
  .movie-grid, .actress-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
