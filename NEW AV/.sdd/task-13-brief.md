# Task 13: Favorites 收藏页面

**Files to create:**
- `src/stores/favoritesStore.ts`

**Files to modify:**
- `src/views/Favorites.vue` (full rewrite from placeholder)

## Requirements

Two-tab favorites page (影片/女优) with pagination.

### favoritesStore

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  const activeTab = ref<'movies' | 'actresses'>('movies')
  const movies = ref<any[]>([])
  const actresses = ref<any[]>([])
  const movieTotal = ref(0)
  const actressTotal = ref(0)
  const moviePage = ref(1)
  const actressPage = ref(1)
  const loading = ref(false)

  async function loadFavorites(reset = false) {
    if (loading.value) return
    loading.value = true
    try {
      if (reset) { moviePage.value = 1; actressPage.value = 1; movies.value = []; actresses.value = [] }
      
      const mResult = await window.api.getMovies({ 
        page: moviePage.value, pageSize: 20,
        filters: {} // no special filters, get all and filter client-side via is_favorite
      })
      // Filter favorites client-side (or add server-side support later)
      const favMovies = mResult.movies.filter((m: any) => m.is_favorite)
      if (reset) movies.value = favMovies
      else movies.value.push(...favMovies)
      movieTotal.value = mResult.total // approximate

      const aResult = await window.api.getActresses({ page: actressPage.value, pageSize: 20 })
      const favActresses = aResult.actresses.filter((a: any) => a.is_favorite)
      if (reset) actresses.value = favActresses
      else actresses.value.push(...favActresses)
      actressTotal.value = aResult.total
      
      moviePage.value++
      actressPage.value++
    } catch {}
    finally { loading.value = false }
  }

  function setTab(tab: 'movies' | 'actresses') { activeTab.value = tab }

  return { activeTab, movies, actresses, movieTotal, actressTotal, loading, loadFavorites, setTab }
})
```

### Favorites.vue

```vue
<template>
  <div class="favorites">
    <div class="tab-bar">
      <div class="tab" :class="{ active: store.activeTab === 'movies' }" @click="store.setTab('movies')">
        🎬 影片收藏 ({{ store.movieTotal }})
      </div>
      <div class="tab" :class="{ active: store.activeTab === 'actresses' }" @click="store.setTab('actresses')">
        👩 女优收藏 ({{ store.actressTotal }})
      </div>
    </div>

    <div v-if="store.activeTab === 'movies'">
      <div class="grid" v-if="store.movies.length > 0">
        <MovieCard v-for="m in store.movies" :key="m.id" :movie="m" @deleted="handleDelete" @fav-changed="handleFavChange" />
      </div>
      <div class="empty-state" v-else><div class="icon">💔</div><div class="msg">还没有收藏影片</div></div>
    </div>

    <div v-if="store.activeTab === 'actresses'">
      <div class="actress-grid" v-if="store.actresses.length > 0">
        <ActressCard v-for="a in store.actresses" :key="a.id" :actress="a" />
      </div>
      <div class="empty-state" v-else><div class="icon">💔</div><div class="msg">还没有收藏女优</div></div>
    </div>

    <div class="load-more" v-if="store.movies.length >= 20 || store.actresses.length >= 20">
      <button class="btn-load" @click="store.loadFavorites()">加载更多</button>
    </div>
  </div>
</template>
```

### What to do

1. Create `src/stores/favoritesStore.ts`
2. Rewrite `src/views/Favorites.vue`
3. Build & commit
