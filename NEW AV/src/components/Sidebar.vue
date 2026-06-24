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
