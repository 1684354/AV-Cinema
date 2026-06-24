import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export interface MovieFilter {
  hasSubtitle: boolean
  isUncensored: boolean
  hasChinese: boolean
}

export const useMovieStore = defineStore('movie', () => {
  const movies = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref('')
  const sort = ref('created_at')
  const filters = reactive<MovieFilter>({ hasSubtitle: false, isUncensored: false, hasChinese: false })
  const category = ref('all')
  const PAGE_SIZE = 20

  async function loadMovies(reset = false) {
    if (loading.value) return
    loading.value = true
    error.value = ''
    if (reset) { page.value = 1; movies.value = [] }

    try {
      const result = await window.api.getMovies({
        category: category.value,
        sort: sort.value,
        filters: {
          hasSubtitle: filters.hasSubtitle || undefined,
          isUncensored: filters.isUncensored || undefined,
          hasChinese: filters.hasChinese || undefined,
        },
        page: page.value,
        pageSize: PAGE_SIZE
      })
      if (reset) movies.value = result.movies
      else movies.value.push(...result.movies)
      total.value = result.total
      page.value++
    } catch (e: any) {
      error.value = e.message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  function setCategory(cat: string) { category.value = cat }
  function setSort(s: string) { sort.value = s; loadMovies(true) }
  function toggleFilter(key: keyof MovieFilter) {
    (filters as any)[key] = !(filters as any)[key]
    loadMovies(true)
  }
  function removeMovie(id: number) {
    movies.value = movies.value.filter(m => m.id !== id)
    total.value--
  }

  return { movies, total, page, loading, error, sort, filters, category, loadMovies, setCategory, setSort, toggleFilter, removeMovie }
})
