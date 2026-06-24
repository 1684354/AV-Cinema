<template>
  <div class="actress-list" ref="listRef">
    <!-- Sort & Search Bar -->
    <div class="sort-bar">
      <span class="opt" :class="{ active: store.sort === 'movie_count' }" @click="store.setSort('movie_count')">作品数</span>
      <span class="opt" :class="{ active: store.sort === 'name' }" @click="store.setSort('name')">姓名</span>
      <span class="spacer"></span>
      <div class="search-wrap">
        <input
          class="search-input"
          v-model="searchText"
          placeholder="搜索女优..."
          @input="onSearchInput"
        />
      </div>
      <span class="view-count">{{ store.total }} 位女优</span>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="store.loading && store.actresses.length === 0">
      <div class="spinner"></div><span>正在加载女优...</span>
    </div>

    <!-- Error -->
    <div class="error-state" v-else-if="store.error && store.actresses.length === 0">
      <div class="icon">⚠️</div><div class="msg">{{ store.error }}</div>
      <button class="retry" @click="store.loadActresses(true)">🔄 重试</button>
    </div>

    <!-- Empty -->
    <div class="empty-state" v-else-if="!store.loading && store.actresses.length === 0">
      <div class="icon">📭</div><div class="msg">没有找到女优</div>
      <div class="sub" v-if="store.search">尝试修改搜索条件</div>
      <div class="sub" v-else>还没有女优数据</div>
    </div>

    <!-- Normal grid -->
    <div class="grid" v-else>
      <ActressCard v-for="actress in store.actresses" :key="actress.id" :actress="actress" />
    </div>

    <!-- Load more -->
    <div class="load-more" v-if="store.actresses.length > 0 && store.actresses.length < store.total">
      <button class="btn-load" @click="store.loadActresses()" :disabled="store.loading">
        {{ store.loading ? '加载中...' : `🎭 加载更多 (${store.actresses.length} / ${store.total})` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, nextTick } from 'vue'
import { useActressStore } from '@/stores/actressStore'
import { useUiStore } from '@/stores/uiStore'
import ActressCard from '@/components/ActressCard.vue'

const store = useActressStore()
const uiStore = useUiStore()

const listRef = ref<HTMLElement | null>(null)
const searchText = ref(store.search)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// Load on mount
onMounted(() => {
  store.loadActresses(true)
})

// Restore scroll position when re-activated from keep-alive
onActivated(() => {
  const saved = uiStore.getScroll('actress-list')
  if (saved > 0 && listRef.value?.parentElement) {
    nextTick(() => {
      listRef.value!.parentElement!.scrollTop = saved
    })
  }
})

// Save scroll position
function saveScroll() {
  const parent = listRef.value?.parentElement
  if (parent) {
    uiStore.saveScroll('actress-list', parent.scrollTop)
  }
}

// Debounced search
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.setSearch(searchText.value)
  }, 400)
}
</script>

<style scoped>
.actress-list { padding: 0; }

/* Sort bar */
.sort-bar { display: flex; align-items: center; padding: 14px 28px; gap: 8px; flex-wrap: wrap; border-bottom: 1px solid var(--border); background: var(--bg); position: sticky; top: 0; z-index: 10; }
.opt { font-size: 12px; color: var(--fg3); padding: 5px 12px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg2); cursor: pointer; transition: var(--transition); }
.opt:hover { color: var(--fg); border-color: var(--accent2); }
.opt.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.spacer { flex: 1; }
.view-count { font-size: 12px; color: var(--fg4); white-space: nowrap; }

.search-wrap { display: flex; }
.search-input { padding: 5px 12px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg2); color: var(--fg); font-size: 12px; outline: none; width: 160px; transition: var(--transition); }
.search-input:focus { border-color: var(--accent2); }
.search-input::placeholder { color: var(--fg4); }

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
