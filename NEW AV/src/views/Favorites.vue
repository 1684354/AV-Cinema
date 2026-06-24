<template>
  <div class="favorites">
    <!-- Tab Bar -->
    <div class="tab-bar">
      <div class="tab" :class="{ active: store.activeTab === 'movies' }" @click="store.setTab('movies')">
        🎬 影片收藏 ({{ store.movieTotal }})
      </div>
      <div class="tab" :class="{ active: store.activeTab === 'actresses' }" @click="store.setTab('actresses')">
        👩 女优收藏 ({{ store.actressTotal }})
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="store.loading && store.movies.length === 0 && store.actresses.length === 0">
      <div class="spinner"></div><span>正在加载收藏...</span>
    </div>

    <!-- Movies Tab -->
    <div v-if="store.activeTab === 'movies'">
      <div class="grid" v-if="store.movies.length > 0">
        <MovieCard v-for="m in store.movies" :key="m.id" :movie="m" @deleted="handleDelete" @fav-changed="handleFavChange" />
      </div>
      <div class="empty-state" v-else-if="!store.loading">
        <div class="icon">💔</div>
        <div class="msg">还没有收藏影片</div>
      </div>
    </div>

    <!-- Actresses Tab -->
    <div v-if="store.activeTab === 'actresses'">
      <div class="actress-grid" v-if="store.actresses.length > 0">
        <ActressCard v-for="a in store.actresses" :key="a.id" :actress="a" />
      </div>
      <div class="empty-state" v-else-if="!store.loading">
        <div class="icon">💔</div>
        <div class="msg">还没有收藏女优</div>
      </div>
    </div>

    <!-- Load More -->
    <div class="load-more" v-if="(store.activeTab === 'movies' && store.movies.length >= 20) || (store.activeTab === 'actresses' && store.actresses.length >= 20)">
      <button class="btn-load" :disabled="store.loading" @click="store.loadFavorites()">
        {{ store.loading ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useFavoritesStore } from '../stores/favoritesStore'
import MovieCard from '../components/MovieCard.vue'
import ActressCard from '../components/ActressCard.vue'

const store = useFavoritesStore()

onMounted(() => {
  store.loadFavorites(true)
})

function handleDelete(id: number) {
  store.movies = store.movies.filter(m => m.id !== id)
  store.movieTotal--
}

function handleFavChange(id: number, isFav: boolean) {
  if (!isFav) {
    store.movies = store.movies.filter(m => m.id !== id)
    store.movieTotal--
  }
}
</script>

<style scoped>
.favorites {
  padding: 20px 28px;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
}

.tab {
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--fg3);
  cursor: pointer;
  transition: var(--transition);
  user-select: none;
}

.tab:hover {
  color: var(--fg);
  background: var(--surface);
}

.tab.active {
  color: var(--accent2);
  background: rgba(217, 142, 106, 0.1);
}

/* Grids */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.actress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--fg3);
  font-size: 14px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 12px;
}

.empty-state .icon {
  font-size: 48px;
  opacity: 0.6;
}

.empty-state .msg {
  font-size: 15px;
  color: var(--fg3);
}

/* Load More */
.load-more {
  display: flex;
  justify-content: center;
  padding: 24px 0 40px;
}

.btn-load {
  padding: 10px 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg2);
  color: var(--fg);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}

.btn-load:hover:not(:disabled) {
  background: var(--surface);
  border-color: var(--accent2);
  color: var(--accent2);
}

.btn-load:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
