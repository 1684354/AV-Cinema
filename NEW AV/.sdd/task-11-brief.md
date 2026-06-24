# Task 11: ActressList 页面 + ActressCard + actressStore

**Files to create:**
- `src/stores/actressStore.ts`
- `src/components/ActressCard.vue`

**Files to modify:**
- `src/views/ActressList.vue` (full rewrite from placeholder)

## actressStore

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useActressStore = defineStore('actress', () => {
  const actresses = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref('')
  const sort = ref('movie_count')
  const search = ref('')

  async function loadActresses(reset = false) {
    if (loading.value) return
    loading.value = true
    error.value = ''
    if (reset) { page.value = 1; actresses.value = [] }

    try {
      const result = await window.api.getActresses({
        sort: sort.value,
        page: page.value,
        pageSize: 20,
        search: search.value || undefined
      })
      if (reset) actresses.value = result.actresses
      else actresses.value.push(...result.actresses)
      total.value = result.total
      page.value++
    } catch (e: any) {
      error.value = e.message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  function setSort(s: string) { sort.value = s; loadActresses(true) }
  function setSearch(s: string) { search.value = s; loadActresses(true) }

  return { actresses, total, page, loading, error, sort, search, loadActresses, setSort, setSearch }
})
```

## ActressCard.vue

A compact card showing:
- Circular avatar (72px, placeholder 🎭)
- Name (日文/英文)
- Cup (罩杯) + Height (身高)
- Movie count (作品数)

With hover effect and click → `/actress/:id`.

```vue
<template>
  <div class="acard" @click="goDetail">
    <div class="avatar">🎭</div>
    <div class="aname">{{ actress.name || '未知' }}</div>
    <div class="asub">
      <span v-if="actress.cup">{{ actress.cup }}罩杯</span>
      <span v-if="actress.height">{{ actress.height }}cm</span>
    </div>
    <div class="acount">{{ actress.movie_count || 0 }} 部作品</div>
  </div>
</template>
```

**Props:** `actress: any`

## ActressList.vue

Four states (loading, error, empty, normal) + sort bar + card grid.

Layout:
- Sort bar: 作品数 / 姓名 (toggle)
- Search input (for searching actresses by name)
- Grid: 5 columns of ActressCards
- Load more button
- Back/restore scroll similar to MovieList

## What to do

1. Create `src/stores/actressStore.ts`
2. Create `src/components/ActressCard.vue`
3. Rewrite `src/views/ActressList.vue`
4. Build: `npx vite build`
5. Commit

## Working directory

`/c/Users/Administrator/Desktop/CLADUE/NEW AV`
