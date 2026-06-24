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
