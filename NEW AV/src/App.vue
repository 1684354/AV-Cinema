<template>
  <div class="app" v-if="!uiStore.isDetailView">
    <Sidebar />
    <div class="main">
      <div class="topbar">
        <SearchBar />
        <div class="actions">
          <button class="btn-random" @click="goRandom">🎲 随机</button>
        </div>
      </div>
      <div class="view-container">
        <router-view v-slot="{ Component }">
          <keep-alive include="MovieList">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
    </div>
  </div>
  <div class="app detail-mode" v-else>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/uiStore'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

watch(() => route.path, (path) => {
  uiStore.setDetailView(path.startsWith('/movie/') || path.startsWith('/actress/'))
})

async function goRandom() {
  try {
    const { movies } = await window.api.getMovies({ sort: 'random', page: 1, pageSize: 1 })
    if (movies && movies.length > 0) router.push(`/movie/${movies[0].id}`)
  } catch {}
}
</script>

<style scoped>
.app { display: flex; height: 100vh; }
.app.detail-mode { display: block; }
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar { display: flex; align-items: center; padding: 14px 28px; background: var(--bg); border-bottom: 1px solid var(--border); gap: 16px; flex-shrink: 0; }
.actions { display: flex; gap: 10px; }
.btn-random { padding: 7px 16px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg2); color: var(--fg3); font-size: 12px; transition: var(--transition); cursor: pointer; }
.btn-random:hover { background: var(--surface); color: var(--fg); }
.view-container { flex: 1; overflow-y: auto; }
</style>
