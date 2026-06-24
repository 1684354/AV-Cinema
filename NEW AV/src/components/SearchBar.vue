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
