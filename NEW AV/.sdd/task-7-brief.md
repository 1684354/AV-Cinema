# Task 7: 主布局 + 侧边栏 + 顶栏 + uiStore

**Files to create:**
- `src/components/Sidebar.vue`
- `src/components/SearchBar.vue`
- `src/stores/uiStore.ts`

**Files to modify:**
- `src/App.vue` — 完整布局

## src/stores/uiStore.ts

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const scrollPositions = ref<Record<string, number>>({})
  const isDetailView = ref(false)
  const sidebarCollapsed = ref(false)

  function saveScroll(key: string, pos: number) {
    scrollPositions.value[key] = pos
  }
  function getScroll(key: string): number {
    return scrollPositions.value[key] || 0
  }
  function setDetailView(val: boolean) {
    isDetailView.value = val
  }

  return { scrollPositions, isDetailView, sidebarCollapsed, saveScroll, getScroll, setDetailView }
})
```

## src/components/SearchBar.vue

```vue
<template>
  <div class="search-wrap">
    <span class="search-ico">🔍</span>
    <input v-model="query" @keydown.enter="doSearch" placeholder="搜索影片或女优..." />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const query = ref('')

function doSearch() {
  const q = query.value.trim()
  if (q) router.push({ path: '/search', query: { q } })
}
</script>

<style scoped>
.search-wrap { flex: 1; position: relative; }
.search-wrap input { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; padding: 9px 20px 9px 40px; font-size: 13px; color: var(--fg); outline: none; transition: var(--transition); }
.search-wrap input::placeholder { color: var(--fg4); }
.search-wrap input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(162,74,58,.15); }
.search-ico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px; color: var(--fg4); }
</style>
```

## src/components/Sidebar.vue

```vue
<template>
  <nav class="sidebar">
    <div class="logo">🎞<span>CINEMA</span></div>

    <div class="grp">浏览</div>
    <router-link v-for="item in browseItems" :key="item.path"
      :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
      <span class="ico">{{ item.icon }}</span>{{ item.label }}
      <span class="badge" v-if="item.count !== undefined">{{ item.count }}</span>
    </router-link>

    <div class="sep"></div>
    <div class="grp">发现</div>
    <router-link v-for="item in discoverItems" :key="item.path"
      :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
      <span class="ico">{{ item.icon }}</span>{{ item.label }}
    </router-link>

    <div class="sep"></div>
    <div class="grp">管理</div>
    <router-link v-for="item in manageItems" :key="item.path"
      :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
      <span class="ico">{{ item.icon }}</span>{{ item.label }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const movieCount = ref<number>(0)

const browseItems = [
  { path: '/category/all', icon: '📽️', label: '全部', count: undefined as number | undefined },
  { path: '/category/av', icon: '🔞', label: 'AV' },
  { path: '/category/anime', icon: '🎨', label: '动漫' },
  { path: '/category/euro', icon: '🌍', label: '欧美' },
  { path: '/category/cn', icon: '🇨🇳', label: '国产' },
]
const discoverItems = [
  { path: '/actresses', icon: '👩', label: '女优' },
  { path: '/favorites', icon: '♥', label: '收藏' },
  { path: '/tags', icon: '🏷️', label: '标签' },
  { path: '/websites', icon: '🌐', label: '网站导航' },
]
const manageItems = [
  { path: '/add', icon: '➕', label: '添加影片' },
  { path: '/settings', icon: '⚙️', label: '设置' },
]

function isActive(path: string): boolean {
  if (path.startsWith('/category/')) return route.path.startsWith('/category/')
  return route.path === path
}

onMounted(async () => {
  try {
    movieCount.value = await window.api.getMovieCount()
    browseItems[0].count = movieCount.value
  } catch {}
})
</script>

<style scoped>
.sidebar { width: 200px; background: var(--bg2); border-right: 1px solid var(--border); padding: 24px 12px; display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto; }
.logo { font-family: Georgia, serif; font-size: 22px; color: var(--accent2); padding: 8px 12px; margin-bottom: 20px; letter-spacing: 2px; display: flex; align-items: center; gap: 8px; }
.logo span { color: var(--fg); font-size: 20px; }
.grp { font-size: 10px; color: var(--fg4); padding: 8px 12px 4px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: var(--radius-sm); color: var(--fg3); font-size: 13px; transition: var(--transition); margin-bottom: 1px; text-decoration: none; }
.nav-item:hover { background: var(--surface); color: var(--fg); }
.nav-item.active, .nav-item.router-link-exact-active { background: var(--accent); color: #fff; }
.nav-item .ico { font-size: 14px; width: 20px; text-align: center; }
.nav-item .badge { margin-left: auto; font-size: 10px; background: var(--surface); padding: 2px 8px; border-radius: 10px; color: var(--fg3); }
.nav-item.active .badge, .nav-item.router-link-exact-active .badge { background: rgba(255,255,255,.2); color: #fff; }
.sep { margin: 8px 0; border-top: 1px solid var(--border); }
</style>
```

## src/App.vue (full)

```vue
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
```

## What to do

1. Create all 3 new files
2. Rewrite `src/App.vue` with the full content above
3. Build: `npx vite build`
4. Commit

## Working directory

`/c/Users/Administrator/Desktop/CLADUE/NEW AV`
